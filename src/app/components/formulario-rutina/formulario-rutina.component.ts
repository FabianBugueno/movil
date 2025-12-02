import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { RutinaService } from '../../services/rutina.service';
import { Rutina } from '../../models/rutina.interface';
import { Api } from '../../services/api';
import { firstValueFrom } from 'rxjs';
import { ExerciseCacheService } from '../../services/exercise-cache.service';
import { getCategoryNameEs } from '../../data/exercise-categories';

@Component({
  selector: 'formulario-rutina',
  templateUrl: './formulario-rutina.component.html',
  styleUrls: ['./formulario-rutina.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class FormRutinaComponent implements OnInit {
  rutinaForm: FormGroup;
  editando = false;
  rutinaId?: number;
  ejerciciosDisponibles: any[] = [];
  ejerciciosSeleccionados: any[] = [];
  ejerciciosFiltrados: any[] = [];
  
  // Paginación
  paginaActual = 1;
  elementosPorPagina = 10;
  totalPaginas = 1;

  constructor(
    private fb: FormBuilder,
    private rutinaService: RutinaService,
    private router: Router,
    private route: ActivatedRoute,
    private api: Api,
    private exerciseCache: ExerciseCacheService,
    private alertController: AlertController
  ) {
    this.rutinaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      descripcion: ['', Validators.required],
      ejercicios: [[], Validators.required]
    });
    this.ejerciciosSeleccionados = [];
  }

  async ngOnInit() {
    // cargar ejercicios desde caché en memoria (no bloquear UI)
    this.cargarEjercicios();
    this.rutinaId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.rutinaId) {
      this.editando = true;
      this.cargarRutina(this.rutinaId);
    }
  }

  actualizarEjerciciosFiltrados() {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    
    // Filtrar ejercicios que no están seleccionados
    const ejerciciosNoSeleccionados = this.ejerciciosDisponibles.filter(
      ejercicio => !this.ejerciciosSeleccionados.some(seleccionado => seleccionado.id === ejercicio.id)
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

  cargarEjercicios() {
    const jsonList = this.exerciseCache.getAllCachedExercisesSync();
    const list = Array.isArray(jsonList) ? jsonList : [];

    this.ejerciciosDisponibles = list.map((item: any) => {
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
    this.actualizarEjerciciosFiltrados();
  }

  estaEjercicioSeleccionado(ejercicio: any): boolean {
    return this.ejerciciosSeleccionados.some(e => e.id === ejercicio.id);
  }

  agregarEjercicio(event: Event, ejercicio: any) {
    event.stopPropagation(); // Evitar que se propague al ion-item
    if (!this.estaEjercicioSeleccionado(ejercicio)) {
      this.ejerciciosSeleccionados.push(ejercicio);
      this.rutinaForm.patchValue({
        ejercicios: this.ejerciciosSeleccionados
      });
      this.actualizarEjerciciosFiltrados();
    }
  }

  eliminarEjercicioSeleccionado(index: number) {
    this.ejerciciosSeleccionados.splice(index, 1);
    this.rutinaForm.patchValue({
      ejercicios: this.ejerciciosSeleccionados
    });
    this.actualizarEjerciciosFiltrados();
  }

  async cargarRutina(id: number) {
    this.rutinaService.getRutinaById(id).subscribe(rutina => {
      if (rutina) {
        this.rutinaForm.patchValue({
          nombre: rutina.nombre,
          descripcion: rutina.descripcion,
          ejercicios: rutina.ejercicios
        });
        this.ejerciciosSeleccionados = [...rutina.ejercicios];
      }
    });
  }

  async verDescripcion(ejercicio: any) {
    const alert = await this.alertController.create({
      header: ejercicio.nombre,
      subHeader: ejercicio.categoria,
      message: ejercicio.descripcion,
      cssClass: 'alert-description',
      buttons: ['Cerrar']
    });

    await alert.present();

    const alertElement = document.querySelector('.alert-description');
    if (alertElement) {
      const messageElement = alertElement.querySelector('.alert-message');
      if (messageElement) {
        messageElement.innerHTML = ejercicio.descripcion;
      }
    }
  }

  async onSubmit() {
    if (this.rutinaForm.valid) {
      try {
        const rutinaData = {
          ...this.rutinaForm.value,
          ejercicios: this.ejerciciosSeleccionados
        };

        if (this.editando && this.rutinaId) {
          const rutina: Rutina = {
            id: this.rutinaId,
            ...rutinaData,
            fechaCreacion: new Date(),
            usuarioId: ''
          };
          await this.rutinaService.editarRutina(rutina);
        } else {
          await this.rutinaService.agregarRutina(rutinaData);
        }
        await this.router.navigate(['/rutinas']);
      } catch (error: any) {
        console.error('Error al guardar rutina:', error);
      }
    }
  }
}
