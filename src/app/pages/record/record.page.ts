import { Component, OnInit, ViewChild, ElementRef} from '@angular/core';
import { RecordService } from 'src/app/services/record.service';
import { ActivatedRoute, Router } from '@angular/router';
//import { NgSignaturePadOptions, SignaturePadComponent } from '@almothafar/angular-signature-pad';
import { LocationService } from 'src/app/services/location.service';
import { ToastController, NavController, ActionSheetController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource, ImageOptions } from '@capacitor/camera';
import { LoadingService } from 'src/app/services/loading.service';
import { Enterprise } from 'src/app/interfaces/enterprise';
import { UserService } from 'src/app/services/user.service';
import { NetworkService } from 'src/app/services/network.service';
import * as moment from 'moment';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { Observable } from 'rxjs';
import * as momentTz from 'moment-timezone';
import { Project } from 'src/app/interfaces/general_offline';

@Component({
  selector: 'app-record',
  templateUrl: './record.page.html',
  styleUrls: ['./record.page.scss'],
  standalone:false
})

export class RecordPage implements OnInit {

  project: Project | null = null;
  enterprise: Enterprise | undefined = undefined;
  document: "" | undefined;
  //@ViewChild('signature') signaturePad!: SignaturePadComponent;
  //@ViewChild('signature', { static: false, read: ElementRef }) signaturePadElementRef!: ElementRef;
  signature = '';
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
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
    type: "",
    area: "",
    completed: "",
    risks: [],
    latitude: "",
    longitude: "",
    worker_fullname: "",
    worker_id_number: "",
    description: "",
    actions: "",
    suggestions: "",
    boss_signature: "",
    boss_fullname: "",
    url_front: null,
    url_back: null,
    boss_title: "Encargado",
    created_at: "",
    uuid: "",
    disciplines: [],
  }

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
  constructor(public rs: RecordService,
    private activeRouter: ActivatedRoute,
    private router: Router,
    public ls: LocationService,
    private toastController: ToastController,
    private loading: LoadingService,
    private us: UserService,
    private navCtrl: NavController,
    private ns: NetworkService,
    private alertCtrl: AlertCtrlService,
    private actionSheetCtrl: ActionSheetController) { }

  async ngOnInit() {
    this.ls.getLocation();
    this.minDate = moment().startOf('year').format('YYYY-MM-DD');
    this.maxDate = moment().format("YYYY-MM-DD");
    this.edit = false;
    this.record_id = this.activeRouter.snapshot.paramMap.get('recordId');
    this.document = this.us.user.document;
    console.log(this.document);
    this.reportData.worker_id_number = this.document;
    await this.rs.loadStorage();

    if (this.record_id != "" && this.record_id != null) {
      this.edit = true;

      await this.getDetail();


    } else {
      let enterprise_index = this.searchEnterpriseById(this.rs.enterprise_id);
      this.enterprise = this.rs.enterprises[enterprise_index];
      this.project = this.searchProjectById(enterprise_index, this.rs.project_id);
      this.reportData.projectId = this.rs.project_id;
      this.reportData.worker_fullname = this.us.user.name;
      this.reportData.completed = momentTz().tz('America/Lima').format('YYYY-MM-DDTHH:mm:ss');
      this.reportData.created_at = new Date().toISOString();
      this.reportData.project_name = this.project?.name;
      this.reportData.uuid = moment().unix() + "-" + (this.us.user?.roles?.[0]?.pivot?.user_id || '');
      this.reportData.userId = this.us.user.id;
      this.initEmptyModels(); // Añade esta línea
    }

  }
  initEmptyModels() {
    // Inicializa los modelos para riesgos y disciplinas
    this.risks_model = new Array(this.rs.risks.length).fill(false);
    this.disciplines_model = [false]; // Para selección única
  }

  registerCanvasEvents(canvas: HTMLCanvasElement): void {
    // Mouse
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
      this.savePad(); // captura
    });
  
    // Touch
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

    const enterprise = this.rs.enterprises[enterprise_index];


    const projectsList = enterprise.project;


    if (!Array.isArray(projectsList)) {

      return null;
    }


    for (let index = 0; index < projectsList.length; index++) {
      const element = projectsList[index];
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


  getDetail() {
    const recordId = +this.activeRouter.snapshot.paramMap.get('recordId')!;

    console.log('project:', this.project);
    console.log('enterprise_id:', this.project?.enterpriseId);


    this.loading.present();

    this.rs.getDetail(recordId).subscribe({
      next: (response) => {
        this.reportData = response.record;
        this.project = response.record.project;
        this.fillRisks();
        const enterprise_index = this.searchEnterpriseById(this.project?.enterpriseId);
        this.enterprise = this.rs.enterprises[enterprise_index];
        this.fillRisks();
        this.fillDisciplines(); // Añade esta línea
        this.loading.dismiss();

        let fechaMoment = momentTz.tz(this.reportData.completed, 'America/Lima');

        let fecha = fechaMoment.toDate();

        let year = fecha.getFullYear();
        let month = fecha.getMonth() + 1;
        let day = fecha.getDate();
        let hours = fecha.getHours();
        let minutes = fecha.getMinutes();
        let seconds = fecha.getSeconds();

        let fechaFormateada = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.000Z`;

        this.reportData.completed = fechaFormateada;
        console.log("completed", this.reportData.completed)

      },
      error: (err) => {

        this.loading.dismiss();
        this.alertCtrl.present('Error', 'Ocurrió un problema al cargar los datos. Por favor, inténtalo de nuevo.');
      }
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

  drawComplete(event: MouseEvent | Touch) {
  }

  drawStart(event: MouseEvent | Touch) {
  }

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

  saveReport() {
    this.reportData.disciplines = this.disciplines_model[0] ?
      [this.disciplines_model[0]] : [];
    let c_msg = "";
    if (this.reportData.type == "") {
      c_msg += "Debes seleccionar si es seguro o inseguro. ";
    }

    if (this.reportData.categoryId == null) {
      c_msg += "Debes seleccionar medio ambiente, seguridad, salud o calidad. "
    }
    if (this.reportData.disciplines.length == 0) {
      c_msg += "Debes seleccionar una disciplina. "
    }
    if (this.reportData.risks.length == 0) {
      c_msg += "Debes seleccionar al menos una observación. "
    }
    /* if(this.reportData.url_front == null){
        c_msg += "Debes subir foto número 1. "
    }
    if(this.reportData.url_back == null){
        c_msg += "Debes subir foto número 2. "
    } */


    if (c_msg != "") {
      this.alertCtrl.present("JJC", c_msg);
      return;
    }

    this.savePad();
    this.reportData.latitude = this.ls.current_location.latitude;
    this.reportData.longitude = this.ls.current_location.longitude;
    this.loading.present();
    if (!this.ns.checkConnection()) {
      this.rs.saveRecordLocally(this.reportData);
      this.navCtrl.pop();

      this.loading.dismiss();
      return;
    }

    this.rs.saveReport(this.reportData)
      .subscribe(
        (data) => {
          if (!data.error) {
            this.presentToastWithOptions();
          } else {
            this.alertCtrl.present("JJC", data.msg)
          }

          this.navCtrl.pop();
          this.loading.dismiss();
        },
        (error) => {
          this.rs.saveRecordLocally(this.reportData);
          this.navCtrl.pop();

          this.loading.dismiss();

        }
      )

  }

  async presentToastWithOptions() {
    const toast = await this.toastController.create({
      message: 'Registro envíado correctamente',
      position: 'bottom',
      duration: 2000
    });
    toast.present();
  }

  async presentActionSheet(type: any) {
    if (this.edit)
      return;

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Imagen',
      mode: 'ios',
      buttons: [{
        text: 'Tomar foto',
        handler: () => {
          this.takePicture(1, type);
        }
      }, {
        text: 'Usar galería',
        handler: () => {
          this.takePicture(0, type);
        }
      }, {
        text: 'Cancelar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
        }
      }]
    });
    await actionSheet.present();
  }

  async takePicture(sourceType: any, type: any) {
    if (this.edit) return;

    // sourceType: 1 = Cámara, 0 = Galería
    const source = sourceType === 1 ? CameraSource.Camera : CameraSource.Photos;

    const options = {
      quality: 50,
      resultType: CameraResultType.Base64,
      encodingType: 'jpeg',
      source, // <-- aquí
      correctOrientation: true,
      allowEditing: false,
      width: 1024,
      height: 768,
    };
    try {
      const image = await Camera.getPhoto(options);
      if (type === 1) {
        this.reportData.url_front = 'data:image/jpeg;base64,' + image.base64String;
      } else {
        this.reportData.url_back = 'data:image/jpeg;base64,' + image.base64String;
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
    let cw = img.height, ch = img.width, cx = 0, cy = img.height * (-1);

    canvas.setAttribute('width', cw + '');
    canvas.setAttribute('height', ch + '');
    cContext.rotate(degree * Math.PI / 180);
    cContext.drawImage(img, cx, cy);
    cContext.restore();
    let dimensions;
    switch (img_type) {
      case 1:
        this.reportData.url_front = canvas.toDataURL("image/jpeg", 100);
        this.getImageDimensions(this.reportData.url_front).then(
          (data) => {
            dimensions = data;
            this.w1 = dimensions.width;
            this.h1 = dimensions.height;
          }
        );
        break;
      case 2:
        this.reportData.url_back = canvas.toDataURL();
        this.getImageDimensions(this.reportData.url_back).then(
          (data) => {
            dimensions = data;
            this.w1 = dimensions.width;
            this.h1 = dimensions.height;
          }
        );
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
    let cw = img.width, ch = img.height, cx = 0, cy = 0;

    switch (degree) {
      case 90:
        cw = img.height;
        ch = img.width;
        cy = img.height * (-1);
        break;
      case 180:
        cx = img.width * (-1);
        cy = img.height * (-1);
        break;
      case 270:
        cw = img.height;
        ch = img.width;
        cx = img.width * (-1);
        break;
    }

    canvas.setAttribute('width', cw + '');
    canvas.setAttribute('height', ch + '');
    cContext.rotate(degree * Math.PI / 180);
    cContext.drawImage(img, cx, cy);
    let dimensions;
    switch (img_type) {
      case 1:
        this.reportData.url_front = canvas.toDataURL("image/jpeg", 100);
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
        this.reportData.url_back = canvas.toDataURL("image/jpeg", 100);
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
    if (type == 1)
      this.reportData.url_front = null;
    else
      this.reportData.url_back = null;
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
      .then(res => res.blob())
      .then(blob => {
        return new File([blob], name);
      })
  }

  calculateImageSize(base64String: any) {
    let padding, inBytes, base64StringLength;
    if (base64String.endsWith("==")) padding = 2;
    else if (base64String.endsWith("=")) padding = 1;
    else padding = 0;

    base64StringLength = base64String.length;
    inBytes = (base64StringLength / 4) * 3 - padding;
    return inBytes / 1000;
  }
}
