import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DocumentsMainPage } from './documents-main.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DocumentsMainPage,
    RouterModule.forChild([{ path: '', component: DocumentsMainPage }]),
  ],
})
export class DocumentsMainPageModule {}