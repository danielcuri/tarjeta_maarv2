import { Injectable } from '@angular/core';
import { AlertController, Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

type VersionResponse = {
  versionAndroid: string;
  versionIos: string;
  urlAndroid: string;
  urlIos: string;
};

@Injectable({ providedIn: 'root' })
export class UpdateService {
  private prompted = false;
  private apiUrl = `${environment.apiUrl}/version`;

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private alertCtrl: AlertController
  ) {}

  async checkVersionOnLaunch() {
    if (this.prompted) return;

    try {
      const info = await App.getInfo();        
      const localVersion = info.version || '0.0.0';
      const isAndroid = this.platform.is('android');
      const isIos     = this.platform.is('ios');

      const data = await firstValueFrom(this.http.get<VersionResponse>(this.apiUrl));

      const remoteVersion = isAndroid ? data.versionAndroid : isIos ? data.versionIos : null;
      const storeUrl      = isAndroid ? data.urlAndroid     : data.urlIos;

      console.log('[UpdateService] local:', localVersion, 'remote:', remoteVersion);

      if (!remoteVersion) return;

      if (!this.isLocalUpToDate(localVersion, remoteVersion)) {
        this.prompted = true; 
        const alert = await this.alertCtrl.create({
          header: 'Actualización disponible',
          message: 'Hay una nueva versión de Tarjeta MAAR. Debes actualizar para continuar.',
          backdropDismiss: false,
          buttons: [
            {
              text: 'Actualizar',
              handler: async () => {
                try { await Browser.open({ url: storeUrl }); } catch {}
              }
            }
          ]
        });
        await alert.present();
      }
    } catch (e) {
      console.warn('[UpdateService] Error verificando versión:', e);
    }
  }

  private isLocalUpToDate(local: string, remote: string): boolean {
    const L = local.split('.').map(n => parseInt(n, 10));
    const R = remote.split('.').map(n => parseInt(n, 10));
    for (let i = 0; i < Math.max(L.length, R.length); i++) {
      const lv = L[i] ?? 0, rv = R[i] ?? 0;
      if (lv < rv) return false; 
      if (lv > rv) return true; 
    }
    return true;
  }
}
