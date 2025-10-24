import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ListaRutinasComponent } from '../../components/lista-rutinas/lista-rutinas.component';

@Component({
  selector: 'app-rutinas',
  templateUrl: './rutinas.page.html',
  styleUrls: ['./rutinas.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, ListaRutinasComponent]
})
export class RutinasPage {
  constructor() {}
}