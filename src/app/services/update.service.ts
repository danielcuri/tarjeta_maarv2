import { Injectable } from '@angular/core';
import { AlertController, Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private prompted = false;
  private apiUrl = 'https://tu-backend.com/version'; // <-- cambia a tu endpoint real

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private alertCtrl: AlertController
  ) {}

  async checkVersionOnLaunch() {
    if (this.prompted) return;
    this.prompted = true;

    try {
      const info = await App.getInfo();
      const localVersion = info.version;
      const isAndroid = this.platform.is('android');
      const isIos = this.platform.is('ios');

      // 1️⃣ Llama al backend
      const data: any = await this.http.get(this.apiUrl).toPromise();

      const remoteVersion = isAndroid
        ? data.versionAndroid
        : isIos
        ? data.versionIos
        : null;
      const storeUrl = isAndroid ? data.urlAndroid : data.urlIos;

      if (!remoteVersion) return;

      // 2️⃣ Compara versiones
      const isUpToDate = this.compareVersions(localVersion, remoteVersion);
      if (!isUpToDate) {
        const alert = await this.alertCtrl.create({
          header: 'Actualización disponible',
          message:
            'Hay una nueva versión de Tarjeta MAAR. Actualiza para seguir disfrutando de todas las funciones.',
          backdropDismiss: false,
          buttons: [
            {
              text: 'Actualizar',
              handler: async () => {
                await Browser.open({ url: storeUrl });
              },
            },
          ],
        });
        await alert.present();
      }
    } catch (error) {
      console.warn('Error verificando versión:', error);
    }
  }

  // Simple comparador de versiones "1.3.0" vs "1.4.0"
  private compareVersions(local: string, remote: string): boolean {
    const l = local.split('.').map(Number);
    const r = remote.split('.').map(Number);

    for (let i = 0; i < Math.max(l.length, r.length); i++) {
      const lv = l[i] || 0;
      const rv = r[i] || 0;
      if (lv < rv) return false; // local es menor
      if (lv > rv) return true;  // local es mayor (probablemente build interna)
    }
    return true; // iguales
  }
}
