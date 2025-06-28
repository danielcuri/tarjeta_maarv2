import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ActivateUserCodePageRoutingModule } from './activate-user-code-routing.module';

import { ActivateUserCodePage } from './activate-user-code.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ActivateUserCodePageRoutingModule
  ],
  declarations: [ActivateUserCodePage]
})
export class ActivateUserCodePageModule {}
