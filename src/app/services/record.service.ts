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

  async ensureOfflineInfo(userId: number): Promise<void> {
  await this.loadStorage();

  if (!Array.isArray(this.enterprises) || this.enterprises.length === 0) {
    return new Promise<void>((resolve) => {
      this.getGeneralInformation(userId).subscribe({
        next: (res: any) => {
          const data = res?.data ?? res;
          if (data) this.saveOfflineData(data); 
          resolve();
        },
        error: () => resolve(), 
      });
    });
  }
}

  getFiles(params: any = {}) {
  const clean = { ...params };
  if (clean.filter && typeof clean.filter !== 'string') {
    clean.filter = JSON.stringify(clean.filter);
  }
  if (!clean.limit) clean.limit = 20; 
  if (!clean.sort)  clean.sort  = 'id';
  if (!clean.order) clean.order = 'desc';
  return this.http.get(`${environment.apiUrl}/file`, { params: clean });
}

getFiletypes(params: any = {}) {
  const clean = { ...params };
  if (clean.filter && typeof clean.filter !== 'string') {
    clean.filter = JSON.stringify(clean.filter);
  }
  return this.http.get(`${environment.apiUrl}/filetype`, { params: clean });
}

  getUserFiles(userId: number, params: any = {}) {
    return this.query.executeQuery<any>('get', `/file/getUserFiles/${userId}`, params);
  }

  downloadFileById(id: number) {
    return `${environment.apiUrl}/file/download/${id}`;
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

  deleteReport(userId: number) {
    return this.query.executeQuery<OfflineGeneral>(
      'delete',
      `/record/${userId}`,
      {}
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
      this.navCtrl.navigateRoot('/tarjeta-main');
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
