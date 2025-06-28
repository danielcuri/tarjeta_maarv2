import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TarjetaMainPage } from './tarjeta-main.page';

const routes: Routes = [
  {
    path: '',
    component: TarjetaMainPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TarjetaMainPageRoutingModule {}
