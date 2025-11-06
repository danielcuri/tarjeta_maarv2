import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AlertCtrlService } from 'src/app/services/alert-ctrl.service';
import { LoadingService } from 'src/app/services/loading.service';
import { NetworkService } from 'src/app/services/network.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
  standalone: false,
})
export class ChangePasswordPage implements OnInit {
  userData: any = {
    old_password: '',
    password: '',
    password_confirmation: '',
  };
  internet: Boolean = false;
  page = '';
  constructor(
    private loading: LoadingService,
    private alertCtrl: AlertCtrlService,
    private us: UserService,
    private ns: NetworkService,
    private activeRouter: ActivatedRoute,
    private navCtrl: NavController,
    private router: Router
  ) {}

  ionViewDidEnter() {
    this.internet = this.ns.checkConnection();
  }

  ngOnInit() {
    this.page = this.activeRouter.snapshot.paramMap.get('page') ?? ''; // Asigna un string vacío si es null
  }

  changePassword(event: any) {
    this.loading.present();
    this.us.changePassword(this.userData).subscribe(
      (data) => {
        this.loading.dismiss();
        if (data.error) {
          this.us.manageErrors(data, null);
          return;
        }

        this.alertCtrl.present('JJC', data.msg);
        this.userData.old_password = '';
        this.userData.password = '';
        this.userData.password_confirmation = '';

        if (this.page == 'login') {
          this.navCtrl.setDirection('root');
          this.router.navigate(['/tarjeta-main']);
        }
      },
      (err) => {
        this.loading.dismiss();
        console.log(err);
      }
    );
  }
}
