import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { RutinaService } from '../../services/rutina.service';
import { Rutina } from '../../models/rutina.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-lista-rutinas',
  templateUrl: './lista-rutinas.component.html',
  styleUrls: ['./lista-rutinas.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule]
})
export class ListaRutinasComponent implements OnInit {
  rutinas$: Observable<Rutina[]>;
  @Input() isHomePage: boolean = false;
  
  constructor(private rutinaService: RutinaService) {
    this.rutinas$ = this.rutinaService.getRutinas();
  }

  ngOnInit() {}

  async eliminarRutina(id: number) {
    try {
      await this.rutinaService.eliminarRutina(id);
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
    }
  }

  trackById(index: number, item: Rutina): number {
    return item.id;
  }
}