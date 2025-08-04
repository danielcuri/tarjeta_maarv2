import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LoadingService } from 'src/app/services/loading.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-activate-user',
  templateUrl: './activate-user.page.html',
  styleUrls: ['./activate-user.page.scss'],
  standalone: false,
})
export class ActivateUserPage implements OnInit {
  constructor(
    private loading: LoadingService,
    private us: UserService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {}

  logout() {
    this.loading.present();
    this.us.logout().subscribe(
      (data) => {
        this.loading.dismiss();
        this.us.clearAll();
        this.navCtrl.navigateRoot('/login');
      },
      (err) => {
        this.loading.dismiss();
        console.log(err);
      }
    );
  }

  doRefresh(event: any) {
    this.checkUser(event);
  }

  checkUser(event?: any) {
    this.loading.present();
    this.us.checkUserActivate().subscribe(
      (data) => {
        if (event) {
          event.target.complete();
        }
        this.loading.dismiss();
        // Verifica si data y data.user están definidos antes de intentar acceder a la propiedad user
        if (data && data.user && data.user.status === 1) {
          this.us.user.status = 1;
          this.us.saveData();
          this.navCtrl.navigateRoot('/pre-main');
        }
      },
      (err) => {
        if (event) {
          event.target.complete();
        }
        this.loading.dismiss();
        console.log(err);
      }
    );
  }
}
