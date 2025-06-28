import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecoverPassPage } from './recover-pass.page';

const routes: Routes = [
  {
    path: '',
    component: RecoverPassPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecoverPassPageRoutingModule {}
