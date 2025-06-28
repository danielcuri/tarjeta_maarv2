import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { Enterprise, Project } from 'src/app/interfaces/enterprise';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { LoadingService } from 'src/app/services/loading.service';
import { NetworkService } from 'src/app/services/network.service';
import { RecordService } from 'src/app/services/record.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-pre-main',
  templateUrl: './pre-main.page.html',
  styleUrls: ['./pre-main.page.scss'],
  standalone: false,
})
export class PreMainPage implements OnInit {
  enterprises: Enterprise[] = [];
  projects: Project[] = [];
  enterprise_id: any = '';
  project_id: any = '';
  show_corona = false;
  show_corona_card = false;
  corona_data: any = {};
  constructor(
    private loading: LoadingService,
    private rs: RecordService,
    private navCtrl: NavController,
    private ip: NetworkService,
    private router: Router,
    private us: UserService,
    private alertCtrl: AlertCtrlService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {}

  ionViewDidEnter() {
    if (this.ip.checkConnection()) {
      const userId = this.us.user?.id;

      if (userId) {
        this.getGeneralInformation(userId);
      } else {
        console.error('Error: User ID not found in UserService after login.');
        this.alertCtrl.present(
          'Error',
          'No se pudo obtener la información del usuario. Intente nuevamente.'
        );
        this.navCtrl.navigateRoot('/login');
      }
    } else {
      this.enterprises = this.rs.enterprises;
      this.projects = this.rs.projects;
    }
  }

  getGeneralInformation(userId: number, event?: any) {
    this.loading.present();
    this.rs.getGeneralInformation(userId).subscribe(
      (data) => {
        this.loading.dismiss();
        if (event) event.target.complete();

        const offlineData = data;

        if (data.default_password) {
          //this.navCtrl.setDirection('root');
          this.router.navigate(['/change-password', { page: 'login' }]);
          return;
        }

        this.rs.saveOfflineData(offlineData);

        this.enterprises = this.rs.enterprises;

        this.show_corona_card =
          offlineData.coronaforms?.flag_active &&
          !offlineData.coronaforms?.flag_done;
        this.show_corona = offlineData.coronaforms?.can_register_covid;
        this.rs.corona_data = offlineData.coronaforms;
      },
      (err) => {
        this.loading.dismiss();
        if (event) event.target.complete();
        console.log(err);
      }
    );
  }

  doRefresh(event: any) {
    if (this.ip.checkConnection()) {
      const userId = this.us.user?.id;
      if (userId) {
        this.getGeneralInformation(userId, event);
      } else {
        console.error('Error: User ID not found for refresh.');
        event.target.complete();
      }
    } else {
      console.log(this.rs.enterprises);
      event.target.complete();
    }
  }

  onChange(event: any) {
    this.projects = [];
    let i = -1;
    this.enterprises.forEach((element, index) => {
      if (element.id == this.enterprise_id) {
        i = index;
      }
    });

    if (i > -1) {
      this.projects = this.enterprises[i].project;
    }
  }

  async saveCurrectSelection() {
    console.log('PreMainPage: saveCurrectSelection - Inicia');
    this.rs.enterprise_id = this.enterprise_id;
    this.rs.project_id = this.project_id;
    console.log('PreMainPage: Antes de guardar datos...');
    await this.rs.saveData();
    console.log('PreMainPage: Datos guardados, navegando...');
    if (this.modalCtrl && this.modalCtrl.getTop) {
      const modal = await this.modalCtrl.getTop();
      if (modal) {
        console.log('PreMainPage: Cerrando modal...');
        await this.modalCtrl.dismiss({
          enterprise_id: this.enterprise_id,
          project_id: this.project_id,
        });
        return; // No navegamos aquí
      }
    }

    this.navCtrl.navigateRoot('main');
    console.log('PreMainPage: Llamada a navigateRoot ejecutada.');
  }

  coronaForm() {
    this.router.navigate(['/corona']);
  }

  coronaCard() {
    this.router.navigate(['/corona-card']);
  }
}
