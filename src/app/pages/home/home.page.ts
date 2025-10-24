import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router, RouterModule } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { lastValueFrom, firstValueFrom } from 'rxjs';
import { Api } from 'src/app/services/api';
import { getCategoryNameEs } from 'src/app/data/exercise-categories';
import { AlertController } from '@ionic/angular';
import { Db } from 'src/app/services/db';
import { AuthService } from 'src/app/services/auth.service';
import { ListaRutinasComponent } from '../../components/lista-rutinas/lista-rutinas.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ListaRutinasComponent]
})
export class HomePage implements OnInit {
  usuario: string = '';
  contrasena: string = '';
  lista_ejercicios: any[] = [];
  ejerciciosFiltrados: any[] = [];
  paginaActual = 1;
  elementosPorPagina = 10;
  totalPaginas = 1;

  constructor(private router: Router, private navCtrl: NavController, private db : Db, private api : Api, private alertCtrl: AlertController, private auth: AuthService) {}

  ngOnInit() {
    
    const navigation = this.router.getCurrentNavigation();
    const stateUsuario = navigation?.extras?.state?.['usuario'] || navigation?.extras?.state?.['user'];
    const stateContrasena = navigation?.extras?.state?.['contrasena'] || navigation?.extras?.state?.['password'];
    const stored = localStorage.getItem('user');
    const storedId = localStorage.getItem('idUsuario');

    if (stateUsuario) {
      this.usuario = stateUsuario;
      this.contrasena = stateContrasena || '';
      console.log('Usuario recibido desde el state:', this.usuario);
    } else if (stored) {
      this.usuario = stored;
      console.log('Usuario recuperado desde localStorage:', this.usuario);
    } else {
      console.warn('No se recibió usuario en el state ni en localStorage. Redirigiendo al login...');
      this.router.navigate(['/login']);
    }
    this.ejerciciosListar();
  }

  async cerrarSesion() {
    await this.auth.cerrarSesion();
    let extras: NavigationExtras = {
      replaceUrl: true
    }
    this.router.navigate(['/login'], extras);
  }
  navegarCambiarContrasena() {
    let extras: NavigationExtras = {
      state: {
        usuario: this.usuario,
        contrasena: this.contrasena
      },
      replaceUrl: true
    };

    this.navCtrl.navigateForward('/cambiar-contrasena', extras);
  }

  irPrueba404(): void {
    this.router.navigate(['/perfil-no-existe']);
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarEjerciciosFiltrados();
    }
  }

  actualizarEjerciciosFiltrados() {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    this.ejerciciosFiltrados = this.lista_ejercicios.slice(inicio, fin);
  }

  async ejerciciosListar() {
    try {
      this.lista_ejercicios = [];

      // pedir exerciseinfo solicitando traducciones en español (language=4)
      const resp$ = this.api.obtenerEjerciciosInfo('4', 200);
      const json: any = await firstValueFrom(resp$);

      if (json.results && Array.isArray(json.results)) {
        json.results.forEach((item: any) => {
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

          // categoría: usar el mapa local en español si existe, si no usar item.category.name
          const categoryId = item?.category?.id ?? item?.category;
          let catName = getCategoryNameEs(categoryId as any) || (item?.category?.name ?? null);

          const ejercicio = {
            id: item.id,
            nombre: displayName || `Ejercicio N°${item.id}`,
            descripcion: rawDesc || '<i>Sin descripción disponible</i>',
            categoria: catName || 'Sin categoría'
          };

          // solo agregar si el ejercicio tiene traducción al español (nombre o descripción)
          if (displayName || rawDesc) {
            this.lista_ejercicios.push(ejercicio);
          }
        });

        // Inicializar la paginación
        this.totalPaginas = Math.ceil(this.lista_ejercicios.length / this.elementosPorPagina);
        this.paginaActual = 1;
        this.actualizarEjerciciosFiltrados();
      }
    } catch (error) {
      console.error('Error al cargar ejercicios:', error);
      this.lista_ejercicios = [];
      this.ejerciciosFiltrados = [];
      this.totalPaginas = 1;
      this.paginaActual = 1;
    }
  }

  // Mostrar descripción detallada bajo demanda
  async verDescripcion(ejercicio: any) {
    try {
      const id = ejercicio.id;
      console.log('FBP : solicitando description para id=', id);
      // intentar inglés primero
  const lang = '4';
      let resp: any = null;
      try {
        const resp$ = this.api.obtenerEjercicioInfoPorId(id);
        resp = await lastValueFrom(resp$);
      } catch (err) {
        console.warn('FBP : fallo al obtener description para id=', id, err);
      }

      // si no vino descripción, intentar sin language
      if (!resp || !(resp.description || resp.short_description || (resp.translations && resp.translations.length))) {
        try {
          const resp2$ = this.api.obtenerEjercicioInfoPorId(id);
          const resp2: any = await lastValueFrom(resp2$);
          if (resp2) resp = resp2;
        } catch (err) {
          console.warn('FBP : fallo al obtener description sin language para id=', id, err);
        }
      }

      // intentar otro idioma (ej. language=1) como último recurso
      if (!resp || !(resp.description || resp.short_description || (resp.translations && resp.translations.length))) {
        try {
          const resp3$ = this.api.obtenerEjercicioInfoPorId(id);
          const resp3: any = await lastValueFrom(resp3$);
          if (resp3) resp = resp3;
        } catch (err) {
          console.warn('FBP : fallo al obtener description para id=', id, err);
        }
      }

      // extraer descripción desde translations si existe
      let descripcion = '';
      if (resp) {
        if (resp.description) descripcion = resp.description;
        else if (resp.short_description) descripcion = resp.short_description;
        else if (resp.translations && Array.isArray(resp.translations)) {
          const tr = resp.translations.find((t: any) => String(t.language) === String(lang));
          if (tr && tr.description) descripcion = tr.description;
          else if (resp.translations.length > 0 && resp.translations[0].description) descripcion = resp.translations[0].description;
        }
      }
      if (!descripcion) descripcion = '';

      // strip HTML y presentar texto plano en el modal (con color adaptable)
      const plain = this.stripHtml(descripcion) || 'Sin descripción disponible';
      const safeHtml = `${this.escapeHtml(plain)}`;

      const alert = await this.alertCtrl.create({
        header: ejercicio.nombre,
        subHeader: ejercicio.categoria,
        message: descripcion,
        cssClass: 'alert-description',
        buttons: ['Cerrar']
      });
      await alert.present();

      // Aplicar estilos después de que el alert se muestre
      const alertElement = document.querySelector('.alert-description');
      if (alertElement) {
        const messageElement = alertElement.querySelector('.alert-message');
        if (messageElement) {
          messageElement.innerHTML = descripcion;
        }
      }
    } catch (e) {
      console.error('FBP : error obtener detalle ejercicio', e);
    }
  }
  
  // Helpers: strip HTML tags and escape HTML for safe display
  private stripHtml(html: string): string {
    if (!html) return '';
    // remove tags
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  private escapeHtml(unsafe: string): string {
    if (!unsafe) return '';
    return unsafe.replace(/[&<>"]+/g, function(match) {
      switch (match) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        default: return match;
      }
    });
  }

}

