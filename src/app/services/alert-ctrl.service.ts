import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AlertCtrlService {
  constructor(private alertController: AlertController) {}

  async present(title: any, msg: any) {
    const alert = await this.alertController.create({
      cssClass: 'custom-alert',
      subHeader: title,
      message: msg,
      buttons: ['OK'],
    });

    await alert.present();
    await alert.onDidDismiss();
  }
}
