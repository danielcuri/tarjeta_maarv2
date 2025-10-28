import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NotificationsMainPageRoutingModule } from './notifications-main-routing.module';

import { NotificationsMainPage } from './notifications-main.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NotificationsMainPageRoutingModule
  ],
  declarations: [NotificationsMainPage]
})
export class NotificationsMainPageModule {}
