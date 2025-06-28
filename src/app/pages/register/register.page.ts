import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { LoadingService } from 'src/app/services/loading.service';
import { NetworkService } from 'src/app/services/network.service';
import { UserService } from 'src/app/services/user.service';
import { TermsPage } from '../terms/terms.page';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  userData = {
    fullname: '',
    document: '',
    confirmDni: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: 0,
    code: '',
  };
  internet_flag = false;
  v = 6;
  bg_container = 'none';
  color = '#FFF';
  flag_canvas: Boolean = false;

  constructor(
    private us: UserService,
    private loading: LoadingService,
    private router: Router,
    private ns: NetworkService,
    private alertCtrl: AlertCtrlService,
    private navCtrl: NavController,
    private modalCtrl: ModalController
  ) {
    console.log('REGISTER COSNT');
  }

  ngOnInit() {
    this.internet_flag = this.ns.checkConnection();
    console.log('REGISTER');
  }

  async termsLegal() {
    const modal = await this.modalCtrl.create({
      component: TermsPage,
    });
    await modal.present();
  }

  back() {
    this.navCtrl.navigateRoot('/login');
  }
  register(event: any) {
    console.log('DAta', this.userData);
    if (!this.ns.checkConnection()) {
      this.alertCtrl.present('Error', 'No tiene conexión a internet');
      console.log('NO INTERNET');
      return;
    }
    const validations = [
      {
        valid: !!this.userData.terms,
        message: 'Debes aceptar los términos y condiciones',
      },
      { valid: !!this.userData.email, message: 'Debes ingresar un correo' },
      { valid: !!this.userData.document, message: 'Debes ingresar tu DNI' },
      { valid: !!this.userData.fullname, message: 'Debes ingresar tu nombre' },
      {
        valid: !!this.userData.password,
        message: 'Debes ingresar tu contraseña',
      },
      {
        valid: this.userData.password === this.userData.confirmPassword,
        message: 'Las contraseñas no coinciden',
      },
      {
        valid: this.userData.document === this.userData.confirmDni,
        message: 'Los DNI no coinciden',
      },
      {
        valid: this.userData.password.length >= 4,
        message: 'La contraseña debe tener 4 dígitos como mínimo',
      },
    ];

    for (const v of validations) {
      if (!v.valid) {
        this.alertCtrl.present('MAAR - Me Anticipo Al Riesgo', v.message);
        return;
      }
    }
    console.log(this.userData);
    const dataToSend = {
      fullname: this.userData.fullname,
      document: this.userData.document,
      email: this.userData.email,
      password: this.userData.password,
    };
    this.loading.present();
    this.us.register(dataToSend).subscribe(
      (data) => {
        this.loading.dismiss();

        if (data.type == 0) {
          this.us.user = data.user;
          this.us.activationEmail = this.userData.email; // Guarda email
          this.us.activationCode = data.code; // Guarda Codigo
          this.us.saveData();
          localStorage.setItem('activationEmail', this.userData.email);
          localStorage.setItem('activationCode', data.code.toString());
        } else if (data.type == 1) {
          this.alertCtrl.present('JJC', 'Registro Exitoso').then(() => {
            //this.navCtrl.setDirection('root');
            this.navCtrl.setDirection('root');
            this.router.navigate(['/login']);
          });
        } else {
          const message = data.message || 'Respuesta inválida del servidor';
          this.alertCtrl.present('Error', message);
        }
      },
      (err) => {
        this.loading.dismiss();
        console.log(err);
      }
    );
  }
}
