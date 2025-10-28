import { Injectable } from '@angular/core';
import { QueryService } from './query.service';
import { HttpClient } from '@angular/common/http';
import { NavController, Platform } from '@ionic/angular';
import { EnterpriseAnswer } from '../interfaces/enterprise';
import { General, Simple, UserFileAnswer } from '../interfaces/general';
import { OfflineGeneral } from '../interfaces/general_offline';
import { RecordAnswer } from '../interfaces/record';
import { environment } from 'src/environments/environment';
import { Device } from '@capacitor/device';
import { Preferences } from '@capacitor/preferences';

const apiUrl = environment.apiUrl;
@Injectable({
  providedIn: 'root',
})
export class RecordService {
  version: any;
  projects: any = [];
  enterprises: any = [];
  categories: any = [];
  risks: any = [];
  enterprise_id: any = '';
  project_id: any = '';
  reports: any = [];
  pendientes: any = [];
  deleted: any = [];
  corona_data: any = {};
  covid_records: any[] = [];
  disciplines: any = [];

  constructor(
    private query: QueryService,
    private http: HttpClient,
    private navCtrl: NavController
  ) {
    this.loadStorage();
  }

  getEnterprises() {
    return this.query.executeQuery<EnterpriseAnswer>(
      'get',
      '/getEnterprises',
      {}
    );
  }

  getUserFiles() {
    return this.query.executeQuery<UserFileAnswer>('post', '/getUserFiles', {});
  }

  getInitInfo() {
    return this.query.executeQuery<General>('post', '/getInitInfo', {});
  }
  getNotifications() {
    return this.query.executeQuery<General>('get', '/notifications', {});
  }

  getGeneralInformation(userId: number) {
    return this.query.executeQuery<OfflineGeneral>(
      'get',
      `/getOfflineInfo/${userId}`,
      {}
    );
  }

  saveReport(report: any) {
    return this.query.executeQuery<Simple>('post', '/record', report);
  }

  deleteReport(report: any) {
    return this.query.executeQuery<OfflineGeneral>(
      'post',
      '/deleteReport',
      report
    );
  }

  sendImage(url_img_front: any, url_img_back: any, project_id: any) {
    const data = { url_img_front, url_img_back, project_id };
    return this.query.executeQuery<Simple>('post', '/saveImage', data);
  }

  sendImageWatcher(url_img_front: any, url_img_back: any, project_id: any) {
    const data = { url_img_front, url_img_back, project_id };
    return this.query.executeQuery<Simple>('post', '/saveImage', data);
  }

  getDetail(recordId: number) {
    const url = `${apiUrl}/record/${recordId}`;
    return this.http.get<RecordAnswer>(url);
  }

  async saveData() {
    await this.saveStorage();
    console.log('RecordService: saveData - Guardado en storage completado.');
  }

  saveOfflineData(data: OfflineGeneral) {
    this.version = data.version;
    this.enterprises = data.enterprises;
    this.categories = data.categories;
    this.risks = data.risks;
    this.disciplines = data.disciplines || [];
    this.reports = data.records;
    this.covid_records = data.covid_records;
    this.deleted = [];
    this.saveStorage();
  }

  saveRecordLocally(current_record: any) {
    this.reports = [current_record, ...this.reports];
    this.saveStorage();
  }

  async checkPreSelect() {
    await this.loadStorage();
    if (this.enterprise_id === '' || this.project_id === '') {
      this.navCtrl.navigateRoot('/pre-main');
      return false;
    }
    return true;
  }

  private async saveStorage() {
    const info = await Device.getInfo();
    const isWeb = info.platform === 'web';

    const setPref = async (key: string, value: any) => {
      await Preferences.set({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      });
    };

    await Promise.all([
      setPref('enterprises', this.enterprises),
      setPref('categories', this.categories),
      setPref('risks', this.risks),
      setPref('disciplines', this.disciplines),
      setPref('project_id', this.project_id),
      setPref('enterprise_id', this.enterprise_id),
      setPref('reports', this.reports),
      setPref('version', this.version),
    ]);
  }

  async loadStorage() {
    const getPref = async (key: string, parse = true) => {
      const { value } = await Preferences.get({ key });
      return value ? (parse ? JSON.parse(value) : value) : null;
    };

    this.enterprises = (await getPref('enterprises')) || [];
    this.categories = (await getPref('categories')) || [];
    this.risks = (await getPref('risks')) || [];
    this.disciplines = (await getPref('disciplines')) || [];
    this.project_id = (await getPref('project_id', false)) || '';
    this.enterprise_id = (await getPref('enterprise_id', false)) || '';
    this.version = (await getPref('version', false)) || '';
    this.reports = (await getPref('reports')) || [];
    this.deleted = (await getPref('deleted')) || [];
  }
}
