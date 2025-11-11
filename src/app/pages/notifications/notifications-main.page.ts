import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import {
  AlertController,
  IonModal,
  NavController,
  Platform,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Enterprise, Project } from 'src/app/interfaces/enterprise';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { LoadingService } from 'src/app/services/loading.service';
import { LocationService } from 'src/app/services/location.service';
import { NetworkService } from 'src/app/services/network.service';
import { RecordService } from 'src/app/services/record.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-notifications-main',
  templateUrl: './notifications-main.page.html',
  styleUrls: ['./notifications-main.page.scss'],
  standalone: false,
})
export class NotificationsMainPage implements OnInit {
  fechaInicio: string | null = null;
  fechaFin: string | null = null;

  selectedEnterpriseId: any = '';
  selectedProjectId: any = '';
  searchDni: string = '';

  enterprise: Enterprise | undefined = undefined;
  project: Project | null = null;
  projectsForSelected: Project[] = [];

  reports: any[] = [];
  filteredReports: any[] = [];
  covid_records: any[] = [];

  loading_flag = false;
  show_corona = false;
  show_corona_card = false;

  isAdminOrPM = false;     
  isCollaborator = false;    
  canSeeProjectFilters = false;

  private networkSubscription!: Subscription;

  @ViewChild('desdeDateModal') desdeDateModal!: IonModal;
  @ViewChild('hastaDateModal') hastaDateModal!: IonModal;

  constructor(
    private router: Router,
    public rs: RecordService,
    public ls: LocationService,
    private alertController: AlertController,
    private alertCtrl: AlertCtrlService,
    private loading: LoadingService,
    public us: UserService,
    private navCtrl: NavController,
    private ns: NetworkService,
    private platform: Platform
  ) {
    this.selectedEnterpriseId = '';
    this.selectedProjectId = '';

    const hasChanged = this.ns.checkConnectionAndResetFlag();
    this.networkSubscription = this.ns.isConnected$.subscribe((isConnected) => {
      if (isConnected && !this.loading_flag && hasChanged) {
        this.loading_flag = true;
        this.getGeneralInformation();
      }
    });
  }

  ngOnInit() {
    this.setDefaultDateRange();
    this.applyFilters(); 
  }

  private computeRoleFlags(): void {
    const roles = this.us.user?.roles ?? [];

    const ids: number[] = [];
    const names: string[] = [];

    if (Array.isArray(roles)) {
      for (const r of roles) {
        if (typeof r === 'number') ids.push(r);
        else if (typeof r === 'string') names.push(r);
        else {
          if (r?.id != null) ids.push(Number(r.id));
          if (r?.name) names.push(String(r.name));
        }
      }
    } else {
      if (typeof roles === 'number') ids.push(roles);
      else if (typeof roles === 'string') names.push(roles);
      else {
        if (roles?.id != null) ids.push(Number(roles.id));
        if (roles?.name) names.push(String(roles.name));
      }
    }

    this.isAdminOrPM =
      ids.some((id) => id === 1 || id === 2) ||
      names.some((n) => /admin|administrador|jefe/i.test(n));

    this.isCollaborator =
      ids.some((id) => id === 3) ||
      names.some((n) => /colab/i.test(n));

    this.canSeeProjectFilters = this.isAdminOrPM;

    if (this.isCollaborator) {
      this.selectedEnterpriseId = '';
      this.selectedProjectId = '';
      this.searchDni = '';
    }
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  private setDefaultDateRange(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.fechaFin = this.formatDateToYYYYMMDD(today);
    this.fechaInicio = this.formatDateToYYYYMMDD(thirtyDaysAgo);
  }
  onDateSelectedAndClose(modalType: 'desde' | 'hasta') {
    if (modalType === 'desde' && this.desdeDateModal) this.desdeDateModal.dismiss();
    if (modalType === 'hasta' && this.hastaDateModal) this.hastaDateModal.dismiss();
  }
  applyDateFilters() {
    this.applyFilters();
  }

  async ionViewWillEnter() {
    await this.rs.loadStorage();

    this.computeRoleFlags();

    this.enterprise = undefined;
    this.project = null;
    this.projectsForSelected = [];

    const userId = this.us.user?.id;
    if (this.ns.checkConnection() && userId) {
      this.getGeneralInformation();
    } else {
      this.reports = this.rs.reports || [];
      this.covid_records = this.rs.covid_records || [];
      this.show_corona_card =
        this.rs.corona_data?.flag_active && !this.rs.corona_data?.flag_done;
      this.show_corona = this.rs.corona_data?.can_register_covid;
      this.applyFilters();
    }
  }
  ionViewDidEnter() {
    if (!this.us.user?.roles) this.logout();
  }
  ngOnDestroy() {
    if (this.networkSubscription) this.networkSubscription.unsubscribe();
  }

  onEnterpriseChange() {
    this.enterprise = this.searchEnterpriseById(this.selectedEnterpriseId) || undefined;
    this.projectsForSelected = this.enterprise?.project || [];
    if (!this.projectsForSelected.some(p => String(p.id) === String(this.selectedProjectId))) {
      this.selectedProjectId = '';
      this.project = null;
    } else {
      this.project = this.searchProjectById(this.enterprise!, this.selectedProjectId);
    }
  }
  onProjectChange() {
    this.project = this.enterprise
      ? this.searchProjectById(this.enterprise, this.selectedProjectId)
      : null;
  }

  createReport() {
    if (!this.enterprise || !this.project) {
      this.showError();
      return;
    }
    this.router.navigate(['/record']);
  }
  async showError() {
    const alert = await this.alertController.create({
      cssClass: 'alertFirst',
      subHeader: 'Debe seleccionar una empresa y un proyecto',
      buttons: [{ text: 'Ok', cssClass: 'sky_blue' }],
    });
    await alert.present();
  }
  logout() {
    this.loading.present();
    this.us.logout().subscribe(
      () => {
        this.loading.dismiss();
        this.us.clearAll();
        this.navCtrl.navigateRoot('/login');
      },
      () => this.loading.dismiss()
    );
  }

  searchEnterpriseById(enterprise_id: any): Enterprise | undefined {
    if (!Array.isArray(this.rs.enterprises) || this.rs.enterprises.length === 0) return undefined;
    return this.rs.enterprises.find((e) => e.id == enterprise_id);
  }
  searchProjectById(enterprise: Enterprise, project_id: any): Project | null {
    if (!enterprise || !Array.isArray(enterprise.project)) return null;
    return enterprise.project.find((p: Project) => p.id == project_id) || null;
  }

  doRefresh(event: any) {
    const userId = this.us.user?.id;
    if (!userId) {
      if (event) event.target.complete();
      return;
    }
    this.getGeneralInformation(event);
  }
  getGeneralInformation(event?: any) {
    const userId = this.us.user?.id;
    if (!userId) {
      if (event) event.target.complete();
      return;
    }
    if (!this.ns.checkConnection()) {
      this.covid_records = this.rs.covid_records;
      this.show_corona_card =
        this.rs.corona_data?.flag_active && !this.rs.corona_data?.flag_done;
      this.show_corona = this.rs.corona_data?.can_register_covid;
      if (event) event.target.complete();
      return;
    }
    this.getInfo(userId, event);
  }

  async getInfo(userId: number, event?: any) {
    this.loading.present();
    this.rs.getNotifications().subscribe(
      (response: any) => {
        if (this.loading.isLoading) this.loading.dismiss();
        if (event) event.target.complete();

        if (!response.error && response.data?.rows) {
          let rows = response.data.rows;

          const currentUserId = this.us.user?.id;

          if (this.isCollaborator && currentUserId != null) {
            rows = rows.filter((n: any) => n.directedUserId === currentUserId);
          }

          this.reports = rows;
          this.applyFilters();
        }
      },
      () => {
        if (this.loading.isLoading) this.loading.dismiss();
        if (event) event.target.complete();
        this.alertCtrl.present('Error', 'No se pudieron cargar las notificaciones.');
      }
    );
  }

  private toNum(v: any): number | null {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
  private parseDateInclusive(d: string | null): { start?: Date; end?: Date } {
    const out: { start?: Date; end?: Date } = {};
    if (d) {
      const [y, m, day] = d.split('-').map((s) => parseInt(s, 10));
      if (!isNaN(y) && !isNaN(m) && !isNaN(day)) {
        out.start = new Date(y, m - 1, day, 0, 0, 0, 0);
        out.end   = new Date(y, m - 1, day, 23, 59, 59, 999);
      }
    }
    return out;
  }

  applyFilters() {
    const start = this.parseDateInclusive(this.fechaInicio).start;
    const end   = this.parseDateInclusive(this.fechaFin).end;

    const selE = this.toNum(this.selectedEnterpriseId);
    const selP = this.toNum(this.selectedProjectId);
    const dni  = (this.searchDni || '').trim().toLowerCase();

    let out = [...(this.reports || [])];

    out = out.filter((n) => {
      const pid =
        this.toNum(n.projectId) ??
        this.toNum(n.project_id) ??
        this.toNum(n.project?.id);

      const eid =
        this.toNum(n.enterpriseId) ??
        this.toNum(n.enterprise_id) ??
        this.toNum(n.project?.enterpriseId) ??
        this.toNum(n.project?.enterprise_id) ??
        this.toNum(n.project?.enterprise?.id);

      if (selP !== null && pid !== selP) return false;
      if (selE !== null && eid !== selE) return false;
      return true;
    });

    out = out.filter((n) => {
      const raw = n.notified_at || n.notifiedAt || n.created_at;
      if (!raw) return false;
      const d = new Date(String(raw).includes('T') ? String(raw) : String(raw).replace(' ', 'T'));
      if (isNaN(d.getTime())) return false;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });

    if (dni) {
      out = out.filter((n) =>
        String(n.dni || n.directedUser?.document || '').toLowerCase().includes(dni)
      );
    }

    this.filteredReports = out;
  }

  trackById(_i: number, n: any) {
  return n?.id ?? _i;
  }

  async openLink(url?: string) {
    if (!url) return;
    try {
      await Browser.open({ url });
    } catch {}
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: 'Alerta',
      message:
        'Existe una nueva actualización de la aplicación , ¿Desea actualizarla ahora ?',
      buttons: [
        { text: 'No', role: 'cancel', cssClass: 'secondary' },
        {
          text: 'Si',
          handler: async () => {
            if (this.platform.is('android')) {
              window.open(this.rs.version.link_android, '_system');
            } else {
              await Browser.open({ url: this.rs.version.link_ios });
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
