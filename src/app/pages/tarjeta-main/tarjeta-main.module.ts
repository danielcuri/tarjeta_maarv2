import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TarjetaMainPageRoutingModule } from './tarjeta-main-routing.module';

import { TarjetaMainPage } from './tarjeta-main.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TarjetaMainPageRoutingModule
  ],
  declarations: [TarjetaMainPage]
})
export class TarjetaMainPageModule {}
