import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CambiarContrasenaPageRoutingModule } from './cambiar-contrasena-routing.module';

import { CambiarContrasenaPage } from './cambiar-contrasena.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CambiarContrasenaPageRoutingModule,
    // La página es standalone, debe importarse (no declararse)
    CambiarContrasenaPage
  ]
})
export class CambiarContrasenaPageModule {}
