import { Injectable } from '@angular/core';
import { VersionAnswer } from '../interfaces/version';
import { QueryService } from './query.service';
import { NavController, Platform } from '@ionic/angular';
import { NetworkService } from './network.service';
import { LoadingService } from './loading.service';
import { Device } from '@capacitor/device';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VersionService {
  api_version_flag = false;
  data_version_obj: VersionAnswer | undefined;
  link_android = 'https://play.google.com/store/apps/details?id=tarjeta.maar.jjc.simplex';
  link_ios = 'https://apps.apple.com/pe/app/tarjeta-maar-jjc/id6747202927';
  constructor(
    private qs: QueryService,
    private navCtrl: NavController,
    private ns: NetworkService,
    private platform: Platform,
    private loading: LoadingService
  ) {}

  async checkCurrentVersion(change_page?: any) {
    // return Promise.resolve(false);
    if (!this.ns.checkConnection()) {
      return Promise.resolve(true);
    }

    let api_version: String = '';
    let data_version = this.data_version_obj;
    if (!this.api_version_flag) {
      //this.loading.present();
      data_version = await this.getVersions();
      this.loading.dismiss();
      this.api_version_flag = true;
      if (data_version) {
        this.link_android = data_version.urlAndroid;
        this.link_ios = data_version.urlIos;
        this.data_version_obj = data_version; 
      }
    }
    console.log('data_version', data_version);

    console.log('PLATFORM', this.platform.platforms());
    console.log('PLATFORM ANDROID', this.platform.is('android'));
    const info = await Device.getInfo();
    console.log('DEVICE INFO', info);
    const platform = info.platform;

    if (platform != 'web') {
      let current_version = '';

      current_version = environment.androidVersion;

      let device_name = 'android';
      api_version = data_version?.versionAndroid ?? '';
      if (!this.platform.is('android')) {
        device_name = 'ios';
        current_version = environment.iosVersion;
        api_version = data_version?.versionIos ?? '';
      }

      let _arr_api_version = Number(api_version.split('.').join(''));
      let _arr_current_version = Number(current_version.split('.').join(''));

      // let flags = [];
      // for(let i in _arr_api_version) {
      //   if(_arr_current_version[i] && (Number(_arr_current_version[i]) >= Number(_arr_api_version[i]))){
      //     flags.push(true);
      //   } else if(_arr_current_version[i]){
      //     flags.push(false);
      //   }
      // }

      // let updated_flag = !(flags.indexOf(false) > -1 );
      let updated_flag = _arr_current_version >= _arr_api_version;
      if (!updated_flag) {
        if (!change_page) {
          this.navCtrl.navigateRoot('/update-app');
        }
      }

      this.api_version_flag = false;

      return Promise.resolve(updated_flag);
    } else {
      return Promise.resolve(true);
    }
  }

  async getVersions() {
    const api = await this.qs
      .executeQuery<VersionAnswer>('post', '/getVersion', {})
      .toPromise();

    return api;
  }

  async compareVersions(currentV: any, newV: any) {
    let _arr_api_version = Number(newV.split('.').join(''));
    let _arr_current_version = Number(currentV.split('.'));

    return !(_arr_current_version >= _arr_api_version);
    // let flags = [];
    // for(let i in _arr_api_version) {
    //     if(_arr_current_version[i] && (Number(_arr_current_version[i]) >= Number(_arr_api_version[i]))){
    //         flags.push(true);
    //     } else if(_arr_current_version[i]){
    //         flags.push(false);
    //     }
    // }

    // return !(flags.indexOf(false) > -1);
  }
}
