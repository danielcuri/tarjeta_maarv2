import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PreMainPage } from './pre-main.page';

const routes: Routes = [
  {
    path: '',
    component: PreMainPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PreMainPageRoutingModule {}
