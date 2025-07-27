import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecordPage } from './record.page';

const routes: Routes = [
  {
    // Nueva ruta para manejar el detalle del registro con parámetros
    // Esta ruta coincide con lo que viene DESPUÉS de '/record/'
    path: ':recordId',
    component: RecordPage
  },
  {
    path: '',
    component: RecordPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecordPageRoutingModule {}
