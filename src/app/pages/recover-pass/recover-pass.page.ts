import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { LoadingService } from 'src/app/services/loading.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-recover-pass',
  templateUrl: './recover-pass.page.html',
  styleUrls: ['./recover-pass.page.scss'],
  standalone: false,
})
export class RecoverPassPage implements OnInit {
  userData: any = {
    email: '',
  };
  constructor(
    private loading: LoadingService,
    private us: UserService,
    private alertCtrl: AlertCtrlService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {}

  recoverPass(type: any) {
    this.loading.present();
    this.us.recoverPass(this.userData).subscribe(
      (data) => {
        this.loading.dismiss();
        if (data.error) {
          this.us.manageErrors(data);
          return;
        }

        this.alertCtrl.present('OK', data.msg);
        this.navCtrl.navigateRoot('/login');
      },
      (err) => {
        this.loading.dismiss();
        console.log(err);
      }
    );
  }
}
