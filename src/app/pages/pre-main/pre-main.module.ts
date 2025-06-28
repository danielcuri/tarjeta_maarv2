import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PreMainPageRoutingModule } from './pre-main-routing.module';

import { PreMainPage } from './pre-main.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PreMainPageRoutingModule
  ],
  declarations: [PreMainPage]
})
export class PreMainPageModule {}
