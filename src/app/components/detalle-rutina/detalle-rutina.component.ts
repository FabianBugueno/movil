import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController, ModalController } from '@ionic/angular';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { Api } from '../../services/api';
import { firstValueFrom } from 'rxjs';
import { getCategoryNameEs } from '../../data/exercise-categories';
import { RutinaService } from '../../services/rutina.service';
import { DatetimePickerComponent } from '../selector-fecha-hora/selector-fecha-hora.component';
import { Rutina } from '../../models/rutina.interface';

@Component({
  selector: 'app-detalle-rutina',
  templateUrl: './detalle-rutina.component.html',
  styleUrls: ['./detalle-rutina.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, DatetimePickerComponent]
})
export class DetalleRutinaComponent implements OnInit {
  rutina?: Rutina;
  ejerciciosDisponibles: any[] = [];
  paginaActual = 1;
  elementosPorPagina = 10;
  totalPaginas = 1;
  ejerciciosFiltrados: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private rutinaService: RutinaService,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private api: Api,
    private router: Router
  ) {}

  async agregarAlCalendario() {
    if (!this.rutina) return;
    // Abrir modal para seleccionar fecha y hora
    const modal = await this.modalCtrl.create({
      component: DatetimePickerComponent,
    });
    await modal.present();
    const { data } = await modal.onWillDismiss();
    if (!data || !data.start) {
      // usuario canceló
      return;
    }

    try {
      const start = new Date(data.start);
      const duracion = data.duracion || 60;
      await this.rutinaService.crearEventoParaRutina(this.rutina.id, start, duracion);
      const alert = await this.alertController.create({
        header: 'Calendario',
        message: 'La rutina fue agregada al calendario. Revisa la app Calendario del dispositivo.',
        buttons: ['OK']
      });
      await alert.present();
    } catch (error: any) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: error?.message || 'No se pudo agregar la rutina al calendario.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async ngOnInit() {
    await this.cargarEjercicios();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.rutinaService.getRutinaById(id).subscribe(rutina => {
        this.rutina = rutina;
        this.actualizarEjerciciosFiltrados();
      });
    }
  }

  async cargarEjercicios() {
    const resp$ = this.api.obtenerEjerciciosInfo('4', 200);
    const json: any = await firstValueFrom(resp$);
    
    this.ejerciciosDisponibles = (json.results || []).map((item: any) => {
      let displayName = item.name || '';
      if (item.translations && Array.isArray(item.translations)) {
        const tr = item.translations.find((t: any) => String(t.language) === '4');
        if (tr?.name) displayName = tr.name;
      }

      let rawDesc = '';
      if (item.translations && Array.isArray(item.translations)) {
        const tr = item.translations.find((t: any) => String(t.language) === '4');
        if (tr?.description) rawDesc = tr.description;
      }
      rawDesc = rawDesc || item.description || item.short_description || '';

      return {
        id: item.id,
        nombre: displayName || `Ejercicio N°${item.id}`,
        descripcion: rawDesc || 'Sin descripción disponible',
        categoria: item.category ? getCategoryNameEs(item.category) : 'Sin categoría'
      };
    });
  }

  actualizarEjerciciosFiltrados() {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    
    // Filtrar ejercicios que no están en la rutina actual
    const ejerciciosNoSeleccionados = this.ejerciciosDisponibles.filter(
      ejercicio => !this.rutina?.ejercicios.some(e => e.id === ejercicio.id)
    );
    
    this.totalPaginas = Math.ceil(ejerciciosNoSeleccionados.length / this.elementosPorPagina);
    this.ejerciciosFiltrados = ejerciciosNoSeleccionados.slice(inicio, fin);
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarEjerciciosFiltrados();
    }
  }

  async agregarEjercicio(ejercicio: any) {
    if (this.rutina) {
      const rutinaActualizada = {
        ...this.rutina,
        ejercicios: [...this.rutina.ejercicios, ejercicio]
      };
      await this.rutinaService.editarRutina(rutinaActualizada);
      this.rutina = rutinaActualizada;
      this.actualizarEjerciciosFiltrados();
    }
  }

  async eliminarEjercicio(index: number) {
    if (this.rutina) {
      const rutinaActualizada = {
        ...this.rutina,
        ejercicios: this.rutina.ejercicios.filter((_, i) => i !== index)
      };
      await this.rutinaService.editarRutina(rutinaActualizada);
      this.rutina = rutinaActualizada;
      this.actualizarEjerciciosFiltrados();
    }
  }

  async eliminarRutina() {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta rutina?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            if (this.rutina) {
              await this.rutinaService.eliminarRutina(this.rutina.id);
              this.router.navigate(['/rutinas']);
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async verDescripcion(ejercicio: any) {
    const alert = await this.alertController.create({
      header: ejercicio.nombre,
      subHeader: ejercicio.categoria,
      message: ejercicio.descripcion,
      buttons: ['OK']
    });

    await alert.present();
  }
}