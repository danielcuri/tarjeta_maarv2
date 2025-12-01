import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RecordService } from 'src/app/services/record.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
//import { NgSignaturePadOptions, SignaturePadComponent } from '@almothafar/angular-signature-pad';
import { LocationService } from 'src/app/services/location.service';
import {
  ToastController,
  NavController,
  ActionSheetController,
} from '@ionic/angular';
import {
  Camera,
  CameraResultType,
  CameraSource,
  ImageOptions,
} from '@capacitor/camera';
import { LoadingService } from 'src/app/services/loading.service';
import { Enterprise } from 'src/app/interfaces/enterprise';
import { UserService } from 'src/app/services/user.service';
import { NetworkService } from 'src/app/services/network.service';
import * as moment from 'moment';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { Observable } from 'rxjs';
import * as momentTz from 'moment-timezone';
import { Project } from 'src/app/interfaces/general_offline';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-record',
  templateUrl: './record.page.html',
  styleUrls: ['./record.page.scss'],
  standalone: false,
})
export class RecordPage implements OnInit {
  project: Project | null = null;
  enterprise: Enterprise | undefined = undefined;
  enterprises: Enterprise[] = [];
  projects: Project[] = [];

  selectedEnterpriseId: number | '' = '';
  selectedProjectId: number | '' = '';
  document: '' | undefined;
  //@ViewChild('signature') signaturePad!: SignaturePadComponent;
  //@ViewChild('signature', { static: false, read: ElementRef }) signaturePadElementRef!: ElementRef;
  signature = '';
  @ViewChild('canvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  ctx!: CanvasRenderingContext2D;
  isDrawing = false;
  /*signaturePadOptions: NgSignaturePadOptions = {
    minWidth: 2,
    canvasWidth: window.innerWidth,
    canvasHeight: 250,
    backgroundColor: '#f6fbff',
    penColor: '#666a73'
  };*/
  show_extra: Boolean = true;
  reportData: any = {
    userId: null,
    projectId: null,
    project_name: '',
    categoryId: null,
    type: '',
    area: '',
    completed: '',
    risks: [],
    latitude: '',
    longitude: '',
    worker_fullname: '',
    worker_id_number: '',
    notify_email: '',
    description: '',
    actions: '',
    suggestions: '',
    boss_signature: '',
    boss_fullname: '',
    url_front: null,
    url_back: null,
    boss_title: 'Encargado',
    created_at: '',
    uuid: '',
    disciplines: [],
  };

  risks_model: boolean[] = [];
  disciplines_model: boolean[] = [];
  c_images: any = [null, null];
  flag_canvas: Boolean = false;
  record_id: any;
  order: any;
  edit: boolean = false;
  minDate: any;
  maxDate: any;
  size1 = 0;
  size2 = 0;
  w1 = 0;
  w2 = 0;
  h1 = 0;
  h2 = 0;
  readonly = false;
  constructor(
    public rs: RecordService,
    private activeRouter: ActivatedRoute,
    private router: Router,
    public ls: LocationService,
    private toastController: ToastController,
    private loading: LoadingService,
    private us: UserService,
    private navCtrl: NavController,
    private ns: NetworkService,
    private alertCtrl: AlertCtrlService,
    private location: Location,
    private actionSheetCtrl: ActionSheetController
  ) {}

  async ngOnInit() {
    this.ls.getLocation();
    this.minDate = moment().startOf('year').format('YYYY-MM-DD');
    this.maxDate = moment().format('YYYY-MM-DD');
    this.edit = false;
    this.record_id = this.activeRouter.snapshot.paramMap.get('recordId');
    this.document = this.us.user.document;
    console.log(this.document);
    this.reportData.worker_id_number = this.document;
    await this.rs.loadStorage();
    await this.ensureOfflineData();
    this.enterprises = this.rs.enterprises || [];
    this.enterprises = this.rs.enterprises || [];

    if (this.record_id != '' && this.record_id != null) {
      this.edit = true;
      this.readonly = true;
      await this.getDetail();

      if (this.project) {
        this.selectedEnterpriseId = this.project.enterpriseId;
        const idx = this.searchEnterpriseById(this.selectedEnterpriseId);
        if (idx !== -1) {
          this.enterprise = this.rs.enterprises[idx];
          this.projects = this.enterprise?.project || [];
        }
        this.selectedProjectId = this.project.id;
      }
    } else {
      if (this.rs.enterprise_id) {
        this.selectedEnterpriseId = +this.rs.enterprise_id;
        const idx = this.searchEnterpriseById(this.selectedEnterpriseId);
        if (idx !== -1) {
          this.enterprise = this.rs.enterprises[idx];
          this.projects = this.enterprise?.project || [];
        }
      }

      if (this.rs.project_id) {
        this.selectedProjectId = +this.rs.project_id;
        const idx = this.searchEnterpriseById(this.selectedEnterpriseId);
        const p =
          idx !== -1
            ? this.searchProjectById(idx, this.selectedProjectId)
            : null;

        this.project = p;
        this.reportData.projectId = this.selectedProjectId || null;
        this.reportData.project_name = p?.name || '';
      }
      let enterprise_index = this.searchEnterpriseById(this.rs.enterprise_id);
      this.enterprise = this.rs.enterprises[enterprise_index];
      this.project = this.searchProjectById(
        enterprise_index,
        this.rs.project_id
      );
      this.reportData.projectId = this.rs.project_id;
      this.reportData.worker_fullname = this.us.user.name;
      this.reportData.completed = momentTz()
        .tz('America/Lima')
        .format('YYYY-MM-DDTHH:mm:ss');
      this.reportData.created_at = new Date().toISOString();
      this.reportData.project_name = this.project?.name;
      this.reportData.uuid =
        moment().unix() +
        '-' +
        (this.us.user?.roles?.[0]?.pivot?.user_id || '');
      this.reportData.userId = this.us.user.id;
      this.initEmptyModels();
    }
  }
  initEmptyModels() {
    this.risks_model = new Array(this.rs.risks.length).fill(false);
    this.disciplines_model = [false];
  }

  registerCanvasEvents(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      this.ctx.beginPath();
      this.ctx.moveTo(e.offsetX, e.offsetY);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDrawing) return;
      this.ctx.lineTo(e.offsetX, e.offsetY);
      this.ctx.stroke();
    });

    canvas.addEventListener('mouseup', () => {
      this.isDrawing = false;
      this.ctx.closePath();
      this.savePad(); 
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      this.isDrawing = true;
      this.ctx.beginPath();
      this.ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    });

    canvas.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      if (!this.isDrawing) return;
      this.ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
      this.ctx.stroke();
      e.preventDefault();
    });

    canvas.addEventListener('touchend', () => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      this.ctx.closePath();
      this.savePad();
    });
  }

  ionViewDidEnter(): void {
    if (!this.edit) {
      const canvas = this.canvasRef.nativeElement;

      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;

      this.ctx = canvas.getContext('2d')!;
      this.ctx.scale(ratio, ratio);
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 2;

      this.registerCanvasEvents(canvas);
    }
  }

  showHideExtra() {
    this.show_extra = !this.show_extra;
  }

  searchProjectById(enterprise_index: any, project_id: any): Project | null {
    if (
      enterprise_index === -1 ||
      !Array.isArray(this.rs.enterprises) ||
      !this.rs.enterprises[enterprise_index]
    ) {
      return null;
    }

    const enterprise = this.rs.enterprises[enterprise_index];
    const projectsList = enterprise?.project || [];

    if (!Array.isArray(projectsList) || projectsList.length === 0) {
      return null;
    }

    for (let i = 0; i < projectsList.length; i++) {
      const element = projectsList[i];
      if (element.id == project_id) {
        return element;
      }
    }
    return null;
  }

  searchEnterpriseById(enterprise_id: any) {
    for (let index = 0; index < this.rs.enterprises.length; index++) {
      const element = this.rs.enterprises[index];
      if (element.id == enterprise_id) {
        return index;
      }
    }

    return -1;
  }

  /*private resizeSignatureCanvas(): void {
    const canvas: HTMLCanvasElement | null = this.signaturePadElementRef?.nativeElement?.querySelector('canvas');
    if (!canvas) return;
  
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
  
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(ratio, ratio);
    }
  }*/

  private async ensureOfflineData(): Promise<void> {
    const hasEnterprises =
      Array.isArray(this.rs.enterprises) && this.rs.enterprises.length > 0;
    const hasCategories =
      Array.isArray(this.rs.categories) && this.rs.categories.length > 0;
    const hasRisks = Array.isArray(this.rs.risks) && this.rs.risks.length > 0;

    if (hasEnterprises && hasCategories && hasRisks) return;

    const userId = this.us.user?.id;
    if (!userId) return;

    this.loading.present();
    try {
      const data = await firstValueFrom(this.rs.getGeneralInformation(userId));
      this.rs.saveOfflineData(data);
      this.enterprises = this.rs.enterprises || [];

      if (this.selectedEnterpriseId) {
        const idx = this.searchEnterpriseById(this.selectedEnterpriseId);
        this.projects =
          idx !== -1 ? this.rs.enterprises[idx]?.project || [] : [];
      }
    } catch (e) {
      this.alertCtrl.present('Aviso', 'No se pudo cargar la data general.');
    } finally {
      this.loading.dismiss();
    }
  }

  getDetail() {
    const recordId = +this.activeRouter.snapshot.paramMap.get('recordId')!;

    console.log('project:', this.project);
    console.log('enterprise_id:', this.project?.enterpriseId);

    this.loading.present();

    this.rs.getDetail(recordId).subscribe({
      next: (response) => {
        this.reportData = response.record;
        this.project = response.record.project;

        const enterpriseIdRaw =
    (this.project as any)?.enterprise_id ??
    (this.project as any)?.enterpriseId ??
    null;

  const enterpriseIdNum =
    enterpriseIdRaw != null
      ? Number(enterpriseIdRaw)
      : this.findEnterpriseIdByProjectId(this.project?.id);
      const enterprise_index = this.searchEnterpriseById(enterpriseIdNum);
        this.enterprise           = (enterprise_index !== -1) ? this.rs.enterprises[enterprise_index] : undefined;
  this.projects             = this.enterprise?.project || [];
  this.selectedEnterpriseId = enterpriseIdNum || '';
  this.selectedProjectId    = this.project?.id != null ? Number(this.project.id) : '';
        this.fillRisks();
        this.fillDisciplines();
        this.loading.dismiss();

        let fechaMoment = momentTz.tz(
          this.reportData.completed,
          'America/Lima'
        );

        let fecha = fechaMoment.toDate();

        let year = fecha.getFullYear();
        let month = fecha.getMonth() + 1;
        let day = fecha.getDate();
        let hours = fecha.getHours();
        let minutes = fecha.getMinutes();
        let seconds = fecha.getSeconds();

        let fechaFormateada = `${year}-${month
          .toString()
          .padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours
          .toString()
          .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}.000Z`;

        this.reportData.completed = fechaFormateada;
        console.log('completed', this.reportData.completed);
      },
      error: (err) => {
        this.loading.dismiss();
        this.alertCtrl.present(
          'Error',
          'Ocurrió un problema al cargar los datos. Por favor, inténtalo de nuevo.'
        );
      },
    });
  }

  fillRisks() {
    for (let index = 0; index < this.rs.risks.length; index++) {
      const element = this.rs.risks[index];

      this.risks_model[index] = false;

      if (!this.reportData.created_at) {
        if (this.reportData.risks_list.includes(element.id)) {
          this.risks_model[index] = true;
        }
      } else {
        if (this.reportData.risks.includes(element.id + '')) {
          this.risks_model[index] = true;
        }
      }
    }
  }
  fillDisciplines() {
    if (this.reportData.disciplines_list?.length > 0) {
      const selectedDisciplineId = this.reportData.disciplines_list[0];
      this.disciplines_model[0] = selectedDisciplineId;
    } else {
      this.disciplines_model[0] = false;
    }
  }
  savePad(): void {
    const base64 = this.canvasRef.nativeElement.toDataURL('image/png');
    this.reportData.boss_signature = base64;
  }

  clearCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  drawComplete(event: MouseEvent | Touch) {}

  drawStart(event: MouseEvent | Touch) {}

  manageChk(event: any) {
    let d = event.detail;
    if (d.checked) {
      this.reportData.risks.push(d.value);
    } else {
      let i = this.reportData.risks.indexOf(d.value);
      if (i > -1) {
        this.reportData.risks.splice(i, 1);
      }
    }
  }
  goBack(){
    this.navCtrl.back();
  }

  async saveReport() {
    this.reportData.disciplines = this.disciplines_model[0]
      ? [this.disciplines_model[0]]
      : [];
    let c_msg = '';
    if (this.reportData.type == '') {
      c_msg += 'Debes seleccionar si es seguro o inseguro. ';
    }
    if (!this.selectedEnterpriseId || !this.selectedProjectId) {
      this.alertCtrl.present('Aviso', 'Selecciona la empresa y el proyecto.');
      return;
    }
    if (this.reportData.categoryId == null) {
      c_msg += 'Debes seleccionar medio ambiente, seguridad, salud o calidad. ';
    }
    if (this.reportData.disciplines.length == 0) {
      c_msg += 'Debes seleccionar una disciplina. ';
    }
    if (this.reportData.risks.length == 0) {
      c_msg += 'Debes seleccionar al menos una observación. ';
    }
    /* if(this.reportData.url_front == null){
        c_msg += "Debes subir foto número 1. "
    }
    if(this.reportData.url_back == null){
        c_msg += "Debes subir foto número 2. "
    } */

    const email = (this.reportData.notify_email || '').trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmail) {
      c_msg += 'Ingresa un correo válido para notificar. ';
    }

    if (c_msg != '') {
      this.alertCtrl.present('JJC', c_msg);
      return;
    }

    this.savePad();
    this.reportData.latitude = this.ls.current_location.latitude;
    this.reportData.longitude = this.ls.current_location.longitude;
    this.reportData.projectId = this.selectedProjectId as number;
    this.loading.present();
    try {
      if (!this.ns.checkConnection()) {
        this.rs.saveRecordLocally(this.reportData);
        await this.presentToastWithOptions();
        this.resetForm();
        await this.goBackAfterSuccess();
        return;
      }

      const resp = await firstValueFrom(this.rs.saveReport(this.reportData));

      if (!resp.error) {
        const userId = this.us.user?.id;
        if (userId) {
          try {
            const generalRes: any = await firstValueFrom(
              this.rs.getGeneralInformation(userId)
            );
            const generalData = generalRes?.data ?? generalRes;
            if (generalData) {
              this.rs.saveOfflineData(generalData);
            }
          } catch (e) {
            console.log('Error refrescando información general', e);
          }
        }
      
        await this.presentToastWithOptions();
        this.resetForm();
        await this.goBackAfterSuccess();
      } else {
        this.alertCtrl.present(
          'JJC',
          resp.msg || 'Ocurrió un error al registrar.'
        );
      }
    } catch (error) {
      this.rs.saveRecordLocally(this.reportData);
      await this.presentToastWithOptions();
      this.resetForm();
      await this.goBackAfterSuccess();
    } finally {
      await this.loading.dismiss();
    }
  }
  private createInitialReportData() {
    return {
      userId: this.us.user?.id ?? null,
      projectId: this.selectedProjectId || null,
      project_name: this.project?.name || '',
      categoryId: null,
      type: '',
      area: '',
      completed: momentTz().tz('America/Lima').format('YYYY-MM-DDTHH:mm:ss'),
      risks: [],
      latitude: '',
      longitude: '',
      worker_fullname: this.us.user?.name || '',
      worker_id_number: this.document || '',
      notify_email: '',
      description: '',
      actions: '',
      suggestions: '',
      boss_signature: '',
      boss_fullname: '',
      url_front: null,
      url_back: null,
      boss_title: 'Encargado',
      created_at: new Date().toISOString(),
      uuid: `${moment().unix()}-${
        this.us.user?.roles?.[0]?.pivot?.user_id || ''
      }`,
      disciplines: [],
    };
  }

  private resetForm(): void {
    const keepEnterprise = this.selectedEnterpriseId;
    const keepProject = this.selectedProjectId;
    const keepProjectObj = this.project;

    this.reportData = this.createInitialReportData();

    this.selectedEnterpriseId = keepEnterprise;
    this.selectedProjectId = keepProject;
    this.project = keepProjectObj;
    this.reportData.projectId = this.selectedProjectId as number;
    this.reportData.project_name = this.project?.name || '';

    this.risks_model = new Array(this.rs.risks.length).fill(false);
    this.disciplines_model = [false];
    this.reportData.url_front = null;
    this.reportData.url_back = null;
    this.clearCanvas();
  }

  private async goBackAfterSuccess(): Promise<void> {
    const hasHistory = this.router.navigated && window.history.length > 1;

    if (hasHistory) {
      this.location.back();
    } else {
      await this.navCtrl.navigateRoot('/tarjeta-main');
    }
  }

  async presentToastWithOptions() {
    const toast = await this.toastController.create({
      message: 'Registro envíado correctamente',
      position: 'bottom',
      duration: 2000,
    });
    toast.present();
  }

  private findEnterpriseIdByProjectId(projectId: any): number | '' {
  const pid = String(projectId ?? '');
  if (!pid || !Array.isArray(this.rs?.enterprises)) return '';
  for (const ent of this.rs.enterprises) {
    if (Array.isArray(ent?.project) && ent.project.some((p: any) => String(p.id) === pid)) {
      return Number(ent.id);
    }
  }
  return '';
}

  async presentActionSheet(type: any) {
    if (this.edit) return;

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Imagen',
      mode: 'ios',
      buttons: [
        {
          text: 'Tomar foto',
          handler: () => {
            this.takePicture(1, type);
          },
        },
        {
          text: 'Usar galería',
          handler: () => {
            this.takePicture(0, type);
          },
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
          handler: () => {},
        },
      ],
    });
    await actionSheet.present();
  }

  async takePicture(sourceType: any, type: any) {
    if (this.edit) return;

    const source = sourceType === 1 ? CameraSource.Camera : CameraSource.Photos;

    const options = {
      quality: 50,
      resultType: CameraResultType.Base64,
      encodingType: 'jpeg',
      source, 
      correctOrientation: true,
      allowEditing: false,
      width: 1024,
      height: 768,
    };
    try {
      const image = await Camera.getPhoto(options);
      if (type === 1) {
        this.reportData.url_front =
          'data:image/jpeg;base64,' + image.base64String;
      } else {
        this.reportData.url_back =
          'data:image/jpeg;base64,' + image.base64String;
      }
    } catch (err) {
      alert(err);
    }
  }

  __rotateImage(degree: any, img_type: any) {
    let canvas = document.createElement('canvas');
    let cContext = canvas.getContext('2d');
    if (!cContext) {
      return;
    }
    let img = new Image();
    switch (img_type) {
      case 1:
        img.src = this.reportData.url_front;
        break;
      case 2:
        img.src = this.reportData.url_back;
        break;
      default:
        break;
    }
    let cw = img.height,
      ch = img.width,
      cx = 0,
      cy = img.height * -1;

    canvas.setAttribute('width', cw + '');
    canvas.setAttribute('height', ch + '');
    cContext.rotate((degree * Math.PI) / 180);
    cContext.drawImage(img, cx, cy);
    cContext.restore();
    let dimensions;
    switch (img_type) {
      case 1:
        this.reportData.url_front = canvas.toDataURL('image/jpeg', 100);
        this.getImageDimensions(this.reportData.url_front).then((data) => {
          dimensions = data;
          this.w1 = dimensions.width;
          this.h1 = dimensions.height;
        });
        break;
      case 2:
        this.reportData.url_back = canvas.toDataURL();
        this.getImageDimensions(this.reportData.url_back).then((data) => {
          dimensions = data;
          this.w1 = dimensions.width;
          this.h1 = dimensions.height;
        });
        break;
      default:
        break;
    }
  }

  rotateImage(degree: any, img_type: any) {
    let canvas = document.createElement('canvas');
    let cContext = canvas.getContext('2d');
    if (!cContext) {
      return;
    }
    let img = new Image();
    switch (img_type) {
      case 1:
        img.src = this.reportData.url_front;
        break;
      case 2:
        img.src = this.reportData.url_back;
        break;
      default:
        break;
    }
    let cw = img.width,
      ch = img.height,
      cx = 0,
      cy = 0;

    switch (degree) {
      case 90:
        cw = img.height;
        ch = img.width;
        cy = img.height * -1;
        break;
      case 180:
        cx = img.width * -1;
        cy = img.height * -1;
        break;
      case 270:
        cw = img.height;
        ch = img.width;
        cx = img.width * -1;
        break;
    }

    canvas.setAttribute('width', cw + '');
    canvas.setAttribute('height', ch + '');
    cContext.rotate((degree * Math.PI) / 180);
    cContext.drawImage(img, cx, cy);
    let dimensions;
    switch (img_type) {
      case 1:
        this.reportData.url_front = canvas.toDataURL('image/jpeg', 100);
        // this.getImageDimensions(this.reportData.url_front).then(
        //     (data) => {
        //         dimensions = data;
        //         console.log(dimensions);
        //         console.log(dimensions.width);
        //         this.w1 = dimensions.width;
        //         this.h1 = dimensions.height;
        //     }
        // );
        // this.size1 = this.calculateImageSize(this.reportData.url_front);
        break;
      case 2:
        this.reportData.url_back = canvas.toDataURL('image/jpeg', 100);
        // this.getImageDimensions(this.reportData.url_back).then(
        //     (data) => {
        //         dimensions = data;
        //         this.w2 = dimensions.width;
        //         this.h2 = dimensions.height;
        //     }
        // );
        // this.size2 = this.calculateImageSize(this.reportData.url_back);
        break;
      default:
        break;
    }
  }

  clearImg(type: any) {
    if (type == 1) this.reportData.url_front = null;
    else this.reportData.url_back = null;
  }

  activateCanvas(status: boolean): void {
    this.flag_canvas = status;
  }

  getImageDimensions(file: any): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.width, height: image.height });
      };
      image.onerror = (error) => {
        reject(error);
      };
      image.src = file;
    });
  }

  base64ToFile(_base64: any, name: any) {
    fetch(_base64)
      .then((res) => res.blob())
      .then((blob) => {
        return new File([blob], name);
      });
  }

  calculateImageSize(base64String: any) {
    let padding, inBytes, base64StringLength;
    if (base64String.endsWith('==')) padding = 2;
    else if (base64String.endsWith('=')) padding = 1;
    else padding = 0;

    base64StringLength = base64String.length;
    inBytes = (base64StringLength / 4) * 3 - padding;
    return inBytes / 1000;
  }

  onEnterpriseChange() {
    const idx = this.searchEnterpriseById(this.selectedEnterpriseId);
    if (idx !== -1) {
      this.enterprise = this.rs.enterprises[idx];
      this.projects = this.enterprise?.project || [];
    } else {
      this.enterprise = undefined;
      this.projects = [];
    }
    this.selectedProjectId = '';
    this.project = null;
    this.reportData.projectId = null;
    this.reportData.project_name = '';
  }

  onProjectChange() {
    if (!this.selectedEnterpriseId || !this.selectedProjectId) {
      this.project = null;
      this.reportData.projectId = null;
      this.reportData.project_name = '';
      return;
    }
    const idx = this.searchEnterpriseById(this.selectedEnterpriseId);
    const p =
      idx !== -1 ? this.searchProjectById(idx, this.selectedProjectId) : null;

    this.project = p;
    this.reportData.projectId = this.selectedProjectId as number;
    this.reportData.project_name = p?.name || '';
  }
}
