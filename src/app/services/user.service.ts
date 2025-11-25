import { Injectable } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { QueryService } from './query.service';
import { AlertCtrlService } from './alert-ctrl.service';
import { RecordService } from './record.service';
import { UserAnswer } from '../interfaces/login';
import { UserAnswerRegister } from '../interfaces/register';
import { UserConfirm } from '../interfaces/confirm';
import { Simple } from '../interfaces/general';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

const apiUrl = environment.apiUrl;
@Injectable({
  providedIn: 'root',
})
export class UserService {
  activationCode: number = 0;
  activationEmail: string = '';
  user: any = undefined;

  constructor(
    private qs: QueryService,
    private alertCtrl: AlertCtrlService,
    private navCtrl: NavController,
    private rs: RecordService
  ) {
    this.loadStorage();
  }

  login(userData: any) {
    return this.qs.executeQuery<UserAnswer>('post', '/login', userData);
  }

  register(userData: any) {
    return this.qs.executeQuery<UserAnswerRegister>(
      'post',
      '/register',
      userData
    );
  }

  confirm(userData: any) {
    return this.qs.executeQuery<UserConfirm>('post', '/confirm', userData);
  }

  checkUserActivate() {
    return this.qs.executeQuery<UserAnswer>('get', '/checkUser', {});
  }

  changePassword(data: any) {
    return this.qs.executeQuery<Simple>('post', '/changePassword', data);
  }

  recoverPass(data: any) {
    return this.qs.executeQuery<Simple>('post', '/recoverPass', data);
  }

  logout() {
    return this.qs.executeQuery<Simple>('post', '/logout', {});
  }

  deleteAccount(id: number) {
    return this.qs.executeQuery<Simple>('delete', `/user/${id}`, {});
  }

  async checkUser() {
    await this.loadStorage();

    if (!this.user) {
      this.navCtrl.navigateRoot('/login');
      return false;
    }

    return true;
  }

  async checkUserStatus() {
    if (Number(this.user?.status) === 0) {
      this.navCtrl.navigateRoot('/activate-user');
      return false;
    }

    return true;
  }

  async clearAll() {
    await Preferences.clear();
    this.user = {};
    this.rs.enterprise_id = '';
    this.rs.project_id = '';
    this.rs.projects = [];
    this.rs.enterprises = [];
    this.rs.categories = [];
    this.rs.risks = [];
    this.rs.reports = [];
    this.rs.version = {};
  }

  manageErrors(data_resp: any, form: any = null) {
    let msg = data_resp.msg;
    if (data_resp.error && data_resp.msgs) {
      msg = '';
      for (let m in data_resp.msgs) {
        if (form !== null) {
          let elem = form.getElementsByClassName(m + '-errors');
          if (elem[0]) {
            elem[0].innerHTML = data_resp.msgs[m];
          }
        }
        msg += '. ' + data_resp.msgs[m];
      }
      msg = msg.substring(2);
    }

    this.alertCtrl.present('JJC', msg);
  }

  async saveData() {
    await this.saveStorage();
  }

  async saveCode() {
    await this.saveStorage();
  }

  async saveEmail() {
    await this.saveStorage();
  }

  private async saveStorage() {
    await Preferences.set({
      key: 'user',
      value: JSON.stringify(this.user),
    });
  }

  async loadStorage() {
    const { value } = await Preferences.get({ key: 'user' });
    if (value) {
      this.user = JSON.parse(value);
    }
  }
}
