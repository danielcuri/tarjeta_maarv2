import { Component } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private platform: Platform) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      console.log('INICIAAAAR');
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('ion-palette-dark');

      if (Capacitor.getPlatform() !== 'web') {
        StatusBar.setStyle({ style: Style.Light  }); // o 'LIGHT'
      }

      SplashScreen.hide();

      console.log('SE INICIO?');
    });
    console.log('PROBANDO');
  }
}
