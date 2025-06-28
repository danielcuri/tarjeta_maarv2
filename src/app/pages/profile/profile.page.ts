import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { LoadingService } from 'src/app/services/loading.service';
import { NetworkService } from 'src/app/services/network.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit {
  constructor(
    private loading: LoadingService,
    public us: UserService,
    private navCtrl: NavController,
    private ns: NetworkService
  ) {}

  ngOnInit() {}

  logout() {
    if (!this.ns.checkConnection()) {
      this.us.clearAll();
      this.navCtrl.navigateRoot('/login');
      return;
    }

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
}
