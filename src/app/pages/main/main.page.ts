import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  ModalController,
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
import { VersionService } from 'src/app/services/version.service';
import { PreMainPage } from '../pre-main/pre-main.page';
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
  reports: any[] = [];
  covid_records: any[] = [];
  loading_flag: boolean = false;
  version_flag: boolean = false;
  project: Project | null = null; // Inicializar a null
  show_corona = false;
  show_corona_card = false;
  segment_records = '0';
  enterprise: Enterprise | undefined = undefined; // Inicializar a undefined
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
    console.log('MainPage Constructor: Inicia');
    // Estos logs confirman que se está ejecutando aquí
    console.log(
      'MainPage Constructor: rs.enterprise_id =',
      this.rs.enterprise_id
    );
    console.log('MainPage Constructor: rs.enterprises =', this.rs.enterprises); // Verifica qué valor tiene rs.enterprises aquí

    // >>>>>>>>>> LLAMADAS EN EL CONSTRUCTOR <<<<<<<<<<
    // Estas llamadas intentarán usar this.rs.enterprises, que PODRÍA no estar cargado aún.
    let enterprise_index = this.searchEnterpriseById(this.rs.enterprise_id);
    console.log('MainPage Constructor: enterprise_index =', enterprise_index);
    // Solo intenta asignar si la empresa fue encontrada
    if (
      enterprise_index !== -1 &&
      this.rs.enterprises &&
      enterprise_index < this.rs.enterprises.length
    ) {
      this.enterprise = this.rs.enterprises[enterprise_index];
      console.log(
        'MainPage Constructor: Empresa asignada.',
        this.enterprise?.name
      );
      // Ahora intenta buscar el proyecto DENTRO del if donde la empresa existe
      this.project = this.searchProjectById(
        enterprise_index,
        this.rs.project_id
      ); // <-- Aquí se llama el método del error
      console.log(
        'MainPage Constructor: Proyecto asignado.',
        this.project?.name
      );
    } else {
      console.warn(
        'MainPage Constructor: Empresa seleccionada no encontrada o data no cargada en RecordService durante el constructor.'
      );
      // this.enterprise y this.project se quedarán con sus valores iniciales (undefined/null)
      // Considera si necesitas redirigir a /pre-main aquí si es un estado inválido
      // this.navCtrl.navigateRoot('/pre-main');
    }
    // >>>>>>>>>> FIN LLAMADAS EN EL CONSTRUCTOR <<<<<<<<<<

    this.networkSubscription = this.ns.isConnected$.subscribe((isConnected) => {
      console.log('MainPage SUBSCRIBE - CONNECTED?', isConnected);
      console.log('MainPage SUBSCRIBE - LOADING FLAG?', this.loading_flag);
      const hasConnectionChanged = this.ns.checkConnectionAndResetFlag();

      if (isConnected && !this.loading_flag && hasConnectionChanged) {
        console.log(
          'MainPage SUBSCRIBE: Connection detected, potentially fetching new data.'
        );
        // Llama a la lógica para sincronizar/obtener data online si es necesario
        // Asegúrate de que getGeneralInformation/getInfo pueda ejecutarse de forma segura aquí
        this.getGeneralInformation();
      }
    });
    console.log('MainPage Constructor: Finaliza');
  }

  ionViewDidEnter() {
    console.log('DID ENTER');
    if (!this.us.user.roles) {
      console.log('LOGOUT');
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
    console.log('INICIAR');
    this.openProjectModal();
  }
  ngOnDestroy() {
    // Asegúrate de desuscribirte para evitar posibles fugas de memoria
    console.log('DESTROY');
    this.networkSubscription.unsubscribe();
  }
  goTarjetaMain() {
    this.router.navigate(['/tarjeta-main', {}]);
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
    console.log('SERACHING');
    for (let index = 0; index < this.rs.enterprises.length; index++) {
      const element = this.rs.enterprises[index];
      if (element.id == enterprise_id) {
        return index;
      }
    }

    return -1;
  }
  searchProjectById(enterprise_index: any, project_id: any): Project | null {
    console.log(
      'MainPage searchProjectById: Searching for project ID',
      project_id,
      ' within enterprise index',
      enterprise_index
    );

    // ... verificaciones anteriores ...

    const enterprise = this.rs.enterprises[enterprise_index];

    // ... verificaciones de enterprise ...

    // >>>>>>>>>> AÑADIR LOGS DE DIAGNÓSTICO AQUÍ <<<<<<<<<<
    console.log('MainPage searchProjectById: Objeto empresa:', enterprise);
    console.log(
      'MainPage searchProjectById: Valor de enterprise.project ANTES de asignar projectsList:',
      enterprise.project
    );
    // >>>>>>>>>> FIN LOGS <<<<<<<<<<

    const projectsList = enterprise.project; // <<<<< Esta línea asigna projectsList (Probable línea 156 ahora)

    // >>>>>>>>>> AÑADIR LOG DE DIAGNÓSTICO AQUÍ <<<<<<<<<<
    console.log(
      'MainPage searchProjectById: Valor de projectsList DESPUÉS de asignar:',
      projectsList
    );
    // >>>>>>>>>> FIN LOG <<<<<<<<<<

    // >>>>>>>>>> REFINAR LA VERIFICACIÓN DE SEGURIDAD <<<<<<<<<<
    // Verificar que projectsList es un array ANTES de usar .length o iterar
    // Con los logs de arriba, sabremos exactamente qué valor tiene si no es un array.
    if (!Array.isArray(projectsList)) {
      console.warn(
        "MainPage searchProjectById: Expected 'project' to be an array but got:",
        projectsList
      );
      return null;
    }
    // >>>>>>>>>> FIN REFINAR <<<<<<<<<<

    // Ahora el loop es seguro porque 'projectsList' es garantizado un array
    for (let index = 0; index < projectsList.length; index++) {
      // <-- Esta es probablemente la línea 157 ahora
      const element = projectsList[index];
      if (element.id == project_id) {
        return element;
      }
    }

    return null;
  }
  async openProjectModal() {
    const modal = await this.modalCtrl.create({
      component: PreMainPage,
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.6, // Esto significa 60% de alto
    });

    modal.onDidDismiss().then((result) => {
      if (result.data) {
        const { enterprise_id, project_id } = result.data;

        // ✅ Actualizar IDs en RecordService
        this.rs.enterprise_id = enterprise_id;
        this.rs.project_id = project_id;

        // ✅ Buscar y asignar empresa/proyecto como en el constructor
        const enterprise_index = this.searchEnterpriseById(enterprise_id);
        if (enterprise_index !== -1) {
          this.enterprise = this.rs.enterprises[enterprise_index];
          this.project = this.searchProjectById(enterprise_index, project_id);
          console.log('Proyecto actualizado desde modal:', this.project);
        }
      }
    });

    await modal.present();
  }
  logout() {
    console.log('CHAU');
    this.loading.present();
    this.us.logout().subscribe(
      (data) => {
        this.loading.dismiss();
        this.us.clearAll();
        this.navCtrl.navigateRoot('/login');
        console.log('LLEVADO A LOGIN');
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
    console.log('GET INFO');
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
    console.log('LOADINGGG');
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
            this.reports = data.records;
            this.alertCtrl.present('JJC', data.message);
          },
          (err) => {
            this.loading.dismiss();
          }
        );
      }
      return;
    }

    if (!item.id) {
      this.rs.reports.splice(i, 1);
      this.rs.saveData();
      return;
    }

    this.rs.deleted.push(item.id);
    this.rs.reports.splice(i, 1);
    this.reports = this.rs.reports;
    this.rs.saveData();
  }

  coronaForm() {
    this.router.navigate(['/corona']);
  }

  coronaCard() {
    this.router.navigate(['/corona-card']);
  }
}
