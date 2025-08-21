import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { LoadingService } from 'src/app/services/loading.service';
import { NetworkService } from 'src/app/services/network.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  userData = {
    document: '',
    password: '',
  };
  internet_flag = false;
  v = 6;
  bg_container = 'none';
  color = '#FFF';
  version = environment.androidVersion;
  constructor(
    private us: UserService,
    private loading: LoadingService,
    private router: Router,
    private ns: NetworkService,
    private alertCtrl: AlertCtrlService,
    private navCtrl: NavController,
    private modalCtrl: ModalController
  ) {
    console.log('LOGIN COSNT');
    // let version = this.device.version;
    // this.v = Number(version.split('.')[0]);

    // if(this.v < 6)
    // {
    //     this.bg_container = '#FFF';
    //     this.color = '#000';
    // }
  }

  ngOnInit() {
    this.internet_flag = this.ns.checkConnection();
    console.log('LOGIN');
  }

  login(event: any) {
    if (!this.ns.checkConnection()) {
      this.alertCtrl.present('Error', 'No tiene conexión a internet');
      console.log('NO INTERNET');
      return;
    }

    this.loading.present();
    this.us
      .login({
        ...this.userData,
        via: 'app',
      })
      .subscribe(async (data) => {
        this.loading.dismiss();

        console.log(data.type);
        if (data.type == 0) {
          localStorage.setItem(
            'activationCode',
            String(data.code || data.data?.code || '')
          );
          localStorage.setItem('activationDocument', this.userData.document);
          console.log('vistadealfredo');
          this.us.clearAll();
          this.alertCtrl
            .present('Atención', 'Por favor activa tu cuenta')
            .then(() => {
              //this.navCtrl.setDirection('root');
              this.router.navigate(['/activate-user-code']);
            });
          return;
        } else if (data.type == 1) {
          this.us.user = data.user;
          this.us.saveData();

          if (this.userData.password != 'maar') {
            console.log('linea70');
            this.navCtrl.setDirection('root');
            //this.navCtrl.navigateRoot('main');
            // Verificar si hay modales abiertos (similar a saveCurrectSelection)
            //await this.openProjectModal();
            this.router.navigate(['/main']);

            localStorage.removeItem('activationCode');
            localStorage.removeItem('activationDocument');
          } else {
            this.alertCtrl.present(
              'JJC',
              'Bienvenido a JJC MAAR, ahora debes cambiar tu contraseña'
            );
            console.log('linea75');
            //this.navCtrl.setDirection('root');
            this.router.navigate(['/change-password', { page: 'login' }]);
          }
        } else {
          const message = data.message || 'Respuesta inválida del servidor';
          await this.alertCtrl.present('Error', message);
        }
      });
  }
}
