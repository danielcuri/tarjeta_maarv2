import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { UpdateService } from './services/update.service';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private platform: Platform, private updateService: UpdateService) {
    this.platform.ready().then(() => {
      this.updateService.checkVersionOnLaunch(); 
    });
    this.initializeApp();
  }

  private async initializeApp() {
    await this.platform.ready();

    document.body.classList.remove('dark');
    document.documentElement.classList.remove('ion-palette-dark');

    if (Capacitor.isNativePlatform()) {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
    }

    await SplashScreen.hide();
  }
}
