import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { AlertController, NavController } from '@ionic/angular';
import { LoadingService } from 'src/app/services/loading.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-activate-user-code',
  templateUrl: './activate-user-code.page.html',
  styleUrls: ['./activate-user-code.page.scss'],
  standalone: false,
})
export class ActivateUserCodePage implements OnInit, AfterViewInit {
  code: string = '';
  /* displayDigits: string[] = ['', '', '', ''];
  
  @ViewChild('codeInput') codeInput!: ElementRef; */
  @ViewChild('hiddenInput') hiddenInput!: ElementRef;
  constructor(
    private loading: LoadingService,
    private us: UserService,
    private navCtrl: NavController,
    private alertController: AlertController
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {}

  get codeArray(): string[] {
    const arr = this.code.split('');
    while (arr.length < 4) arr.push('');
    return arr;
  }

  onInput(event: any): void {
    const input = event.target.value.replace(/\D/g, '');
    this.code = input.slice(0, 4);
  }

  onBackspace(event: KeyboardEvent): void {
    if (event.key === 'Backspace' && this.code.length > 0) {
      this.code = this.code.slice(0, -1);
      event.preventDefault();
    }
  }

  focusInput(): void {
    this.hiddenInput.nativeElement.focus();
  }

  async presentErrorAlert() {
    const alert = await this.alertController.create({
      header: 'Código incorrecto',
      message: 'Por favor, ingrese el código nuevamente.',
      buttons: ['Aceptar'],
    });

    await alert.present();
  }

  async presentSuccessAlert() {
    const alert = await this.alertController.create({
      header: 'Código correcto',
      message: '¡Tu cuenta ha sido activada exitosamente!',
      buttons: [
        {
          text: 'Aceptar',
          handler: () => {
            this.navCtrl.navigateRoot('/login');
          },
        },
      ],
    });

    await alert.present();
  }

  verifyCode() {
    // Verificar que el código tenga 4 dígitos
    if (this.code.length !== 4) {
      this.presentErrorAlert();
      return;
    }

    const storedDocument = localStorage.getItem('activationDocument');
    const storedCode = localStorage.getItem('activationCode');

    // Verificar si el código ingresado coincide con el almacenado
    if (this.code !== storedCode) {
      this.presentErrorAlert();
      return;
    }

    this.loading.present();

    // Si el código es correcto, enviar al backend
    this.us.confirm({ document: storedDocument, code: this.code }).subscribe(
      (res: any) => {
        this.loading.dismiss();
        if (res?.error === false) {
          this.presentSuccessAlert();
        } else {
          this.presentErrorAlert();
        }
      },
      (err) => {
        this.loading.dismiss();
        this.presentErrorAlert();
      }
    );
  }

  logout() {
    this.loading.present();
    this.us.logout().subscribe(
      () => {
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
}
