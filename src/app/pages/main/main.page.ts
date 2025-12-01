import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  ModalController,
  NavController,
  Platform,
} from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';
import { Enterprise, Project } from 'src/app/interfaces/enterprise';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { LoadingService } from 'src/app/services/loading.service';
import { LocationService } from 'src/app/services/location.service';
import { NetworkService } from 'src/app/services/network.service';
import { RecordService } from 'src/app/services/record.service';
import { UserService } from 'src/app/services/user.service';
import { VersionService } from 'src/app/services/version.service';
import { Browser } from '@capacitor/browser';
import { environment } from 'src/environments/environment';
import { Device } from '@capacitor/device';


@Component({
  selector: 'app-main',
  templateUrl: './main.page.html',
  styleUrls: ['./main.page.scss'],
  standalone: false,
})
export class MainPage implements OnInit {
  project_id: any = '';
  appVersion = '';
  reports: any[] = [];
  covid_records: any[] = [];
  loading_flag: boolean = false;
  version_flag: boolean = false;
  project: Project | null = null; 
  show_corona = false;
  show_corona_card = false;
  segment_records = '0';
  enterprise: Enterprise | undefined = undefined; 
  private networkSubscription!: Subscription;
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
    private vs: VersionService,
    private modalCtrl: ModalController
  ) {
    let enterprise_index = this.searchEnterpriseById(this.rs.enterprise_id);
    if (
      enterprise_index !== -1 &&
      this.rs.enterprises &&
      enterprise_index < this.rs.enterprises.length
    ) {
      this.enterprise = this.rs.enterprises[enterprise_index];
      this.project = this.searchProjectById(
        enterprise_index,
        this.rs.project_id
      ); 
    } else {
      console.warn(
        'MainPage Constructor: Empresa seleccionada no encontrada o data no cargada en RecordService durante el constructor.'
      );
    }

    this.networkSubscription = this.ns.isConnected$.subscribe((isConnected) => {
      const hasConnectionChanged = this.ns.checkConnectionAndResetFlag();

      if (isConnected && !this.loading_flag && hasConnectionChanged) {
        this.getGeneralInformation();
      }
    });
  }

  ionViewDidEnter() {
    if (!this.us.user.roles) {
      this.logout();
    }
    this.ls.getCurrentLocation();
    // this.getGeneralInformation();
    //this.ns.initializeNetworkEvents();
    // this.events.subscribe('internet_change', (data) => {
    //     if(data){
    //         if(this.loading_flag)
    //             return;

    //         this.loading_flag = true;
    //         this.getGeneralInformation();
    //     }
    // });
  }

  ngOnInit() {
  }
  ngOnDestroy() {
    this.networkSubscription.unsubscribe();
  }
  async goTarjetaMain() {
    const userId = this.us.user?.id;
    
    if (this.ns.checkConnection() && userId) {
      try {
        const generalRes: any = await firstValueFrom(
          this.rs.getGeneralInformation(userId)
        );
      
        const generalData = generalRes?.data ?? generalRes;
      
        if (generalData) {
          this.rs.saveOfflineData(generalData);
        }
      } catch (e) {
        console.error('Error actualizando info antes de ir a Tarjeta MAAR', e);
      }
    }
  
    this.router.navigate(['/tarjeta-main', {}]);
  }
  goNotification() {
    this.router.navigate(['/notifications-main', {}]);
  }
  goFichaMain() {
    this.router.navigate(['/ficha-main', {}]);
  }
  goTemperatureCard() {
    this.router.navigate(['/temperature-card', {}]);
  }
  goDocumentMain() {
    this.router.navigate(['/file-main', {}]);
  }
  /*
      ionViewDidLeave() {
          this.events.unsubscribe('internet_change');
      } */

  createReport() {
    if (this.rs.project_id == '' || this.rs.enterprise_id == '') {
      this.showError();
      return;
    }

    this.router.navigate(['/record']);
  }

  searchEnterpriseById(enterprise_id: any) {
    for (let index = 0; index < this.rs.enterprises.length; index++) {
      const element = this.rs.enterprises[index];
      if (element.id == enterprise_id) {
        return index;
      }
    }

    return -1;
  }
  searchProjectById(enterprise_index: any, project_id: any): Project | null {
    const enterprise = this.rs.enterprises[enterprise_index];

    const projectsList = enterprise.project;

    if (!Array.isArray(projectsList)) {
      console.warn(
        "MainPage searchProjectById: Expected 'project' to be an array but got:",
        projectsList
      );
      return null;
    }
    for (let index = 0; index < projectsList.length; index++) {
      const element = projectsList[index];
      if (element.id == project_id) {
        return element;
      }
    }

    return null;
  }

  async ionViewWillEnter() {
  const info = await Device.getInfo().catch(() => ({ platform: 'web' } as any));
  this.appVersion = info.platform === 'ios'
    ? environment.iosVersion
    : environment.androidVersion;
}

goDocuments() {
  this.router.navigate(['/documents-main']);
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
        console.log(err);
      }
    );
  }

  takePhoto() {
    if (this.rs.project_id == '' || this.rs.enterprise_id == '') {
      this.showError();
      return;
    }

    this.router.navigate(['/photos']);
  }

  getGeneralInformation(event?: any) {
    if (!this.ns.checkConnection()) {
      this.reports = this.rs.reports;
      if (event) event.target.complete();

      return;
    } else {
      let pending_reports = this.validatePendingsReports();
      let deleted_reports = this.rs.deleted;
      let data: {
        pending_reports?: any[] | null;
        deleted_reports?: any[] | null;
      } = {};

      if (pending_reports.length > 0) {
        data.pending_reports = pending_reports;
      }
      if (deleted_reports.length > 0) {
        data.deleted_reports = deleted_reports;
      }

      this.getInfo(data, event);
    }
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

  doRefresh(event: any) {
    this.getGeneralInformation(event);
  }

  goDetail(id: any, project_id: any) {
    this.router.navigate([
      '/record',
      { record_id: id, project_id: project_id },
    ]);
  }

  goDetailCovid(id: any) {
    this.router.navigate(['/corona', { corona_id: id }]);
  }

  goWeb() {
    // window.open("https://ssomac.jjc.com.pe/", "_blank");
    Browser.open({ url: 'https://ssomac.jjc.com.pe/' });
    /* const browser = this.iab.create('https://ssomac.jjc.com.pe/'); */
  }

  validatePendingsReports() {
    let pending_reports = [];

    for (let i = 0; i < this.rs.reports.length; i++) {
      if (!this.rs.reports[i].id) pending_reports.push(this.rs.reports[i]);
    }

    return pending_reports;
  }

  async getInfo(parameters: any, event?: any) {
    // if(this.loading_flag)
    //     return;

    // this.loading_flag = true;
    this.loading.present();

    this.rs.getGeneralInformation(parameters).subscribe(
      async (data) => {
        if (this.loading.isLoading) this.loading.dismiss();

        if (event) event.target.complete();

        if (data.default_password) {
          this.navCtrl.setDirection('root');
          this.router.navigate(['/change-password', { page: 'login' }]);
          this.loading_flag = false;
          return;
        }

        this.rs.saveOfflineData(data);
        this.reports = data.records;
        this.covid_records = data.covid_records;
        this.loading_flag = false;
        this.show_corona_card =
          data.coronaforms.flag_active && !data.coronaforms.flag_done;
        this.show_corona = data.coronaforms.can_register_covid;
        this.rs.corona_data = data.coronaforms;
        const info = await Device.getInfo();

        if (info.platform != 'web') {
          let version_local = environment.androidVersion;

          let device_name = 'android';
          if (!this.platform.is('android')) {
            version_local = environment.iosVersion;
            device_name = 'ios';
          }

          this.version_flag = true;
          const version_check = await this.vs.compareVersions(
            version_local,
            this.rs.version[device_name]
          );

          // console.log(version_check,version_local,this.rs.version[device_name],device_name);
          if (!version_check) {
            this.navCtrl.navigateRoot('/update-app');
            this.version_flag = false;
          }
          // if (!this.version_flag && this.rs.version[device_name] != version_local){
          //     this.version_flag = true;
          //     this.navCtrl.navigateRoot('/update-app');
          //     // this.presentAlertConfirm().then(
          //     //     () => {
          //     //         this.version_flag = false;
          //     //     }
          //     // );
          // }
        }
      },
      (err) => {
        this.loading.dismiss();
        this.loading_flag = false;
        if (event) event.target.complete();
        console.log(err);
      }
    );
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
          handler: () => {
            if (this.platform.is('android')) {
              window.open(this.rs.version.link_android, '_system');
              // const browser = this.iab.create(this.rs.version.link_android);
            } else {
              Browser.open({ url: this.rs.version.link_ios });

              /* const browser = this.iab.create(this.rs.version.link_ios); */
            }
          },
        },
      ],
    });

    await alert.present();
  }

  coronaForm() {
    this.router.navigate(['/corona']);
  }

  coronaCard() {
    this.router.navigate(['/corona-card']);
  }
}
