import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LoadingService } from 'src/app/services/loading.service';
import { NetworkService } from 'src/app/services/network.service';
import { UserService } from 'src/app/services/user.service';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {

  isDeleteModalOpen = false;
  deleteCountdown = 5;
  deleteButtonDisabled = true;
  private deleteInterval: any;

  constructor(
    private loading: LoadingService,
    public us: UserService,
    private navCtrl: NavController,
    private ns: NetworkService,
    private alertCtrl: AlertCtrlService
  ) {}

  ngOnInit() {}

  logout() {
    if (!this.ns.checkConnection()) {
      this.us.clearAll();
      this.navCtrl.navigateRoot('/login');
      return;
    }

    this.loading.present();
    this.us.logout().subscribe(
      (data) => {
        this.loading.dismiss();
        this.goToLoginAndClear();
      },
      (err) => {
        this.loading.dismiss();
        console.log(err);
      }
    );
  }

  openDeleteModal() {
    this.isDeleteModalOpen = true;
    this.startDeleteCountdown();
  }

  onDeleteModalDismiss() {
    this.isDeleteModalOpen = false;
    this.resetDeleteCountdown();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.resetDeleteCountdown();
  }

  private startDeleteCountdown() {
    this.resetDeleteCountdown();
    this.deleteButtonDisabled = true;
    this.deleteCountdown = 5;

    this.deleteInterval = setInterval(() => {
      this.deleteCountdown--;

      if (this.deleteCountdown <= 0) {
        this.deleteButtonDisabled = false;
        clearInterval(this.deleteInterval);
        this.deleteInterval = null;
      }
    }, 1000);
  }

  private resetDeleteCountdown() {
    if (this.deleteInterval) {
      clearInterval(this.deleteInterval);
      this.deleteInterval = null;
    }
    this.deleteCountdown = 5;
    this.deleteButtonDisabled = true;
  }

  private goToLoginAndClear() {
    this.us.clearAll();
    this.navCtrl.navigateRoot('/login');
  }

  confirmDeleteAccount() {
  const userId = this.us.user?.id;

  if (!userId) {
    this.alertCtrl.present('Error', 'No se encontró información del usuario en sesión.');
    return;
  }

  if (!this.ns.checkConnection()) {
    this.alertCtrl.present(
      'Error',
      'No se pudo eliminar la cuenta en línea. Verifica tu conexión a internet.'
    );
    return;
  }

  this.loading.present();
  this.us.deleteAccount(userId).subscribe(
    (data) => {
      this.loading.dismiss();

      this.isDeleteModalOpen = false;
      this.resetDeleteCountdown();

      this.us.clearAll();

      setTimeout(() => {
        this.navCtrl.navigateRoot('/login');
      }, 50);
    },
    (err) => {
      this.loading.dismiss();
      console.log(err);
      this.alertCtrl.present(
        'Error',
        'Ocurrió un problema al eliminar la cuenta. Intenta nuevamente.'
      );
    }
  );
}
}
