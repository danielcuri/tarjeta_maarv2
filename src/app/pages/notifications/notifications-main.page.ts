import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { Device } from '@capacitor/device';
import {
  AlertController,
  IonModal,
  NavController,
  Platform,
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Enterprise, Project } from 'src/app/interfaces/enterprise';
import { Record } from 'src/app/interfaces/record';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { LoadingService } from 'src/app/services/loading.service';
import { LocationService } from 'src/app/services/location.service';
import { NetworkService } from 'src/app/services/network.service';
import { RecordService } from 'src/app/services/record.service';
import { UserService } from 'src/app/services/user.service';
import { VersionService } from 'src/app/services/version.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-notifications-main',
  templateUrl: './notifications-main.page.html',
  styleUrls: ['./notifications-main.page.scss'],
  standalone: false,
})
export class NotificationsMainPage implements OnInit {
  fechaInicio: string | null = null;
  fechaFin: string | null = null;
  project_id: any = '';
  reports: any[] = [];
  filteredReports: any[] = []; // 🆕 listado filtrado real
  searchDni: string = ''; // 🆕 filtro por DNI
  covid_records: any[] = [];
  loading_flag: boolean = false;
  version_flag: boolean = false;
  project: Project | null = null;
  show_corona = false;
  show_corona_card = false;
  segment_records = '0';
  enterprise: Enterprise | undefined = undefined;
  selectedEnterpriseId: any = '';
  selectedProjectId: any = '';
  projectsForSelected: Project[] = [];
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
    private platform: Platform,
    private vs: VersionService
  ) {
    this.enterprise = this.searchEnterpriseById(this.rs.enterprise_id);

    if (this.enterprise) {
      this.project = this.searchProjectById(
        this.enterprise,
        this.rs.project_id
      );
    } else {
      this.project = null;
    }

    const hasConnectionChanged = this.ns.checkConnectionAndResetFlag();

    this.networkSubscription = this.ns.isConnected$.subscribe((isConnected) => {
      if (isConnected && !this.loading_flag && hasConnectionChanged) {
        this.loading_flag = true;
        this.getGeneralInformation();
      }
    });
    // después de setear this.enterprise y this.project:
    this.selectedEnterpriseId = this.enterprise?.id ?? this.rs.enterprise_id ?? '';
    if (this.enterprise?.project) {
      this.projectsForSelected = this.enterprise.project;
    }
    this.selectedProjectId = this.project?.id ?? this.rs.project_id ?? '';
  }

  ngOnInit() {
    this.setDefaultDateRange();

    this.onFilterChange();
  }
  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private setDefaultDateRange(): void {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    this.fechaFin = this.formatDateToYYYYMMDD(today);
    this.fechaInicio = this.formatDateToYYYYMMDD(thirtyDaysAgo);
  }

  onDateSelectedAndClose(modalType: 'desde' | 'hasta') {
    if (modalType === 'desde' && this.desdeDateModal) {
      this.desdeDateModal.dismiss();
    } else if (modalType === 'hasta' && this.hastaDateModal) {
      this.hastaDateModal.dismiss();
    }
    // YA NO LLAMAMOS a this.onFilterChange() aquí.
    // El ngModel ya actualizó fechaInicio o fechaFin.
  }

  // NUEVO MÉTODO para ser llamado por el botón "Buscar"
  applyDateFilters() {
    this.onFilterChange();
  }

  onFilterChange() {
    // ====== construir startDate (00:00:00) ======
    let startDate: Date | undefined;
    if (this.fechaInicio) {
      const parts = this.fechaInicio.split('-');
      if (parts.length === 3 && parts.every(p => !isNaN(parseInt(p, 10)))) {
        startDate = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10),
          0, 0, 0, 0
        );
      }
    }
  
    // ====== construir endDate (23:59:59.999) ======
    let endDate: Date | undefined;
    if (this.fechaFin) {
      const parts = this.fechaFin.split('-');
      if (parts.length === 3 && parts.every(p => !isNaN(parseInt(p, 10)))) {
        endDate = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10),
          23, 59, 59, 999
        );
      }
    }
  
    const selEnterpriseId = this.selectedEnterpriseId ? String(this.selectedEnterpriseId) : '';
    const selProjectId    = this.selectedProjectId    ? String(this.selectedProjectId)    : '';
  
    // --- Helper: busca enterpriseId por projectId usando rs.enterprises (fallback robusto)
    const findEnterpriseIdByProjectId = (projectId: any): string | '' => {
      const pid = String(projectId);
      if (!pid || !Array.isArray(this.rs?.enterprises)) return '';
      for (const ent of this.rs.enterprises) {
        if (Array.isArray(ent?.project) && ent.project.some((p: any) => String(p.id) === pid)) {
          return String(ent.id);
        }
      }
      return '';
    };
  
    // --- Helper: obtiene enterpriseId desde el registro por varias rutas
    const getRecordEnterpriseId = (rec: any): string | '' => {
      // 1) rec.enterprise.id directo
      if (rec?.enterprise?.id != null) return String(rec.enterprise.id);
      // 2) rec.project.enterprise_id si existe
      if (rec?.project?.enterprise_id != null) return String(rec.project.enterprise_id);
      // 3) Fallback mapeando project.id → enterprise.id con catálogo local
      if (rec?.project?.id != null) return findEnterpriseIdByProjectId(rec.project.id);
      return '';
    };
  
    this.reports = (this.rs.reports || []).filter((record: Record) => {
      // ====== fecha válida ======
      if (!record.created_at) return false;
    
      const recordDateString =
        typeof record.created_at === 'string'
          ? record.created_at.replace(' ', 'T')
          : (record as any).created_at;
    
      const recordDate = new Date(recordDateString);
      if (isNaN(recordDate.getTime())) return false;
    
      // ====== filtro por Proyecto (solo si hay uno seleccionado) ======
      if (selProjectId) {
        if (!record.project || String((record as any).project.id) !== selProjectId) {
          return false;
        }
      }
    
      // ====== filtro por Empresa (solo si hay una seleccionada) ======
      if (selEnterpriseId) {
        const recEnterpriseId = getRecordEnterpriseId(record);
        // Si logramos determinar empresa del registro, debe coincidir
        if (recEnterpriseId && recEnterpriseId !== selEnterpriseId) {
          return false;
        }
        // Si NO logramos determinar empresa del registro, NO lo excluimos (evita falsos negativos).
        // Esto permite que entren registros huérfanos cuando no traen enterprise, pero si te molesta,
        // cambia esta lógica para excluirlos cuando no se puede verificar.
      }
    
      // ====== filtro por RANGO DE FECHAS ======
      if (startDate && recordDate < startDate) return false;
      if (endDate && recordDate > endDate) return false;
    
      return true;
    });
  }


  async ionViewWillEnter() {
    await this.rs.loadStorage();

    if (!this.enterprise || !this.project) {
      const enterprise_id = this.rs.enterprise_id;
      const project_id = this.rs.project_id;

      if (!enterprise_id || !project_id) {
        this.rs.enterprise_id = '';
        this.rs.project_id = '';
        await this.rs.saveData();
        this.navCtrl.navigateRoot('/pre-main');
        return;
      }

      this.enterprise = this.searchEnterpriseById(enterprise_id);
      if (this.enterprise) {
        this.project = this.searchProjectById(this.enterprise, project_id);
        if (!this.project) {
          this.rs.enterprise_id = '';
          this.rs.project_id = '';
          await this.rs.saveData();
          this.navCtrl.navigateRoot('/pre-main');
          return;
        }
      } else {
        this.rs.enterprise_id = '';
        this.rs.project_id = '';
        await this.rs.saveData();
        this.navCtrl.navigateRoot('/pre-main');
        return;
      }
    }

    const userId = this.us.user?.id;
    if (this.ns.checkConnection() && userId) {
      this.getGeneralInformation();
    } else {
      this.reports = this.rs.reports;
      this.covid_records = this.rs.covid_records;
      this.show_corona_card =
        this.rs.corona_data?.flag_active && !this.rs.corona_data?.flag_done;
      this.show_corona = this.rs.corona_data?.can_register_covid;
    }
  }
  onEnterpriseChange() {
    this.enterprise = this.searchEnterpriseById(this.selectedEnterpriseId) || undefined;
    this.projectsForSelected = this.enterprise?.project || [];
    // Si el proyecto seleccionado ya no pertenece a esta empresa, resetea
    if (!this.projectsForSelected.some(p => String(p.id) === String(this.selectedProjectId))) {
      this.selectedProjectId = '';
      this.project = null;
    } else {
      this.project = this.searchProjectById(this.enterprise!, this.selectedProjectId);
    }
  }
  ionViewDidEnter() {
    if (!this.us.user?.roles) {
      this.logout();
    }
  }

  ngOnDestroy() {
    if (this.networkSubscription) {
      this.networkSubscription.unsubscribe();
    }
  }

  createReport() {
    if (!this.enterprise || !this.project) {
      this.showError();
      return;
    }
    this.router.navigate(['/record']);
  }
  async showError() {
    let t = this;
    const alert = await this.alertController.create({
      cssClass: 'alertFirst',
      subHeader: 'Debe seleccionar una empresa y un proyecto',
      buttons: [
        {
          text: 'Ok',
          cssClass: 'sky_blue',
          handler: () => {},
        },
      ],
    });
    await alert.present();
  }
  logout() {
    this.loading.present();
    this.us.logout().subscribe(
      (data) => {
        this.loading.dismiss();
        this.us.clearAll();
        this.navCtrl.navigateRoot('/login');
      },
      (err) => {
        this.loading.dismiss();
      }
    );
  }

  searchEnterpriseById(enterprise_id: any): Enterprise | undefined {
    if (
      !this.rs.enterprises ||
      !Array.isArray(this.rs.enterprises) ||
      this.rs.enterprises.length === 0
    ) {
      return undefined;
    }

    return this.rs.enterprises.find((element) => element.id == enterprise_id);
  }

  searchProjectById(enterprise: Enterprise, project_id: any): Project | null {
    if (
      !enterprise ||
      !enterprise.project ||
      !Array.isArray(enterprise.project)
    ) {
      return null;
    }

    const projectsList = enterprise.project;

    return (
      projectsList.find((element: Project) => element.id == project_id) || null
    );
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
    } else {
      let pending_reports = this.validatePendingsReports();
      let deleted_reports = this.rs.deleted;
      let syncData: {
        pending_reports?: any[] | null;
        deleted_reports?: any[] | null;
      } = {};

      if (pending_reports.length > 0) {
        syncData.pending_reports = pending_reports;
      }
      if (deleted_reports.length > 0) {
        syncData.deleted_reports = deleted_reports;
      }

      this.getInfo(userId, event);
    }
  }

  goDetail(id: any) {
    const recordId = id;
    const navigationPath = ['/record', recordId];
    this.router.navigate(navigationPath);
  }

  validatePendingsReports() {
    let pending_reports = [];
    for (let i = 0; i < this.rs.reports.length; i++) {
      if (!this.rs.reports[i].id) pending_reports.push(this.rs.reports[i]);
    }
    return pending_reports;
  }

  deleteRecord(item: any, i: any) {
    if (this.ns.checkConnection()) {
      if (item.id) {
        let data_delete = {
          id: item.id,
        };
        this.loading.present();
        this.rs.deleteReport(data_delete).subscribe(
          (data) => {
            this.loading.dismiss();
            this.rs.saveOfflineData(data);
            this.reports = this.rs.reports;
            this.alertCtrl.present('JJC', data.message);
          },
          (err) => {
            this.loading.dismiss();
            this.alertCtrl.present(
              'Error',
              'No se pudo eliminar el registro en línea.'
            );
          }
        );
      }
      return;
    }

    if (!item.id) {
      this.rs.reports.splice(i, 1);
      this.reports = this.rs.reports;
      this.rs.saveData();
      return;
    }

    this.rs.deleted.push(item.id);
    this.rs.reports.splice(i, 1);
    this.reports = this.rs.reports;
    this.rs.saveData();
  }

  async getInfo(userId: number, event?: any) {
    this.loading.present();

    this.rs.getNotifications().subscribe(
      (response: any) => {
        if (this.loading.isLoading) this.loading.dismiss();
        if (event) event.target.complete();

        if (!response.error && response.data?.rows) {
          let allNotifications = response.data.rows;

          // 🔍 Obtenemos rol e ID del usuario actual
          const roles = this.us.user?.roles;
          const userRole = Array.isArray(roles) ? roles[0] : roles;
          const currentUserId = this.us.user?.id;

          console.log('Usuario actual:', { id: currentUserId, rol: userRole });

          // 🧠 Si el usuario NO es rol 1, solo ve las suyas
          if (userRole !== 1) {
            allNotifications = allNotifications.filter(
              (n: any) => n.directedUserId === currentUserId
            );
          } else {
            console.log('Usuario rol 1 → ve todas las notificaciones');
          }

          // Guardar y aplicar filtros visuales
          this.reports = allNotifications;
          this.applyFilters();

          console.log('Notificaciones visibles:', this.reports);
        }
      },
      (err) => {
        if (this.loading.isLoading) this.loading.dismiss();
        if (event) event.target.complete();
        this.alertCtrl.present('Error', 'No se pudieron cargar las notificaciones.');
      }
    );
  }


  // 🔍 Aplica todos los filtros combinados
  applyFilters() {
    let startDate: Date | null = this.fechaInicio ? new Date(this.fechaInicio) : null;
    let endDate: Date | null = this.fechaFin ? new Date(this.fechaFin) : null;

    const selEnterpriseId = this.selectedEnterpriseId ? String(this.selectedEnterpriseId) : '';
    const selProjectId = this.selectedProjectId ? String(this.selectedProjectId) : '';
    const searchDni = this.searchDni.trim().toLowerCase();

    this.filteredReports = this.reports.filter((n) => {
      // Filtro Empresa
      if (selEnterpriseId && String(n.enterpriseId) !== selEnterpriseId) return false;

      // Filtro Proyecto
      if (selProjectId && String(n.projectId) !== selProjectId) return false;

      // Filtro por fechas (notified_at)
      const notified = n.notified_at ? new Date(n.notified_at) : null;
      if (startDate && notified && notified < startDate) return false;
      if (endDate && notified && notified > endDate) return false;

      // Filtro por DNI (en directedUser.document o campo dni)
      if (searchDni) {
        const userDni =
          (n.dni || n.directedUser?.document || '').toString().toLowerCase();
        if (!userDni.includes(searchDni)) return false;
      }

      return true;
    });
  }
  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: 'Alerta',
      message:
        'Existe una nueva actualización de la aplicación , ¿Desea actualizarla ahora ?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {},
        },
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
