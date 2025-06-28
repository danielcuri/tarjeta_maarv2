import { Component, OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { VersionService } from 'src/app/services/version.service';
import { Browser } from '@capacitor/browser';
@Component({
  selector: 'app-update-app',
  templateUrl: './update-app.page.html',
  styleUrls: ['./update-app.page.scss'],
  standalone: false,
})
export class UpdateAppPage implements OnInit {
  constructor(
    private platform: Platform,
    private vs: VersionService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {}

  ionViewDidEnter() {
    this.checkVersion();
  }

  doRefresh(event: any) {
    this.checkVersion(event);
  }

  checkVersion(event?: any) {
    const flag = this.vs.checkCurrentVersion(1);
    flag.then((data) => {
      if (data) {
        this.navCtrl.navigateRoot('pre-main');
      }

      if (event) event.target.complete();
    });
  }

  async goStore() {
    if (this.platform.is('android')) {
      window.open(this.vs.link_android, '_system');
      // const browser = this.iab.create(this.rs.version.link_android);
    } else {
      Browser.open({ url: this.vs.link_ios });
      /* const browser = this.iab.create(this.vs.link_ios); */
    }
  }
}
