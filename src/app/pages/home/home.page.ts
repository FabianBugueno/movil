import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { Api } from 'src/app/services/api';
import { AlertController } from '@ionic/angular';
import { Db } from 'src/app/services/db';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HomePage implements OnInit {
  usuario: string = '';
  contrasena: string = '';
  lista_ejercicios: any[] = [];

  constructor(private router: Router, private navCtrl: NavController, private db : Db, private api : Api, private alertCtrl: AlertController) {}

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

  cerrarSesion() {
    this.db.eliminarSesion();
    // limpiar claves locales asociadas al usuario
    localStorage.removeItem('user');
    localStorage.removeItem('idUsuario');

    let extras: NavigationExtras = {
      replaceUrl: true
    }

    this.router.navigate(['/login'], extras);
  }
  navegarCambiarContrasena() {
  let extras:  NavigationExtras ={
    state: { 
            usuario: this.usuario,
            contrasena: this.contrasena
           },
           replaceUrl: true

  } 
  this.navCtrl.navigateForward('/cambiar-contrasena', extras);
  } 

  async ejerciciosListar(){
  // obtener la información detallada (incluye descripción) desde /exerciseinfo/ (pedimos español language=4)
  const lang = '4';
  console.log('FBP : solicitando exerciseinfo con language=' + lang);
  let ejercicios_esperados = this.api.obtenerEjerciciosInfo(lang, 100);
    let ejercicios = await lastValueFrom(ejercicios_esperados);
  console.log('FBP : ejercicioinfo raw from API ->', ejercicios);
  let json_texto = JSON.stringify(ejercicios);
  let json = JSON.parse(json_texto);
  // loguear los primeros 5 objetos como JSON para inspección
  console.log('FBP : parsed ejercicioinfo results (first 5) ->', json['results'] ? JSON.stringify(json['results'].slice(0,5)) : JSON.stringify(json));

    this.lista_ejercicios = [];

    for (let i = 0; json['results'] && i < json['results'].length; i++) {
      const item = json['results'][i];
      let ejercicio: any = {};
    ejercicio.id = item['id'];
  // intentar obtener el nombre y la descripción desde translations (buscar language=lang)
  let rawDesc = '';
  let displayName = '';
  if (item['translations'] && Array.isArray(item['translations'])) {
    const tr = item['translations'].find((t: any) => String(t.language) === String(lang));
    if (tr) {
      displayName = tr.name || '';
      if (tr.description) rawDesc = tr.description;
    }
  }
  // fallbacks si no hay traducción
  if (!displayName) displayName = item['name'] || (`Ejercicio N°${item['id']}`);
  if (!rawDesc) rawDesc = item['description'] || item['short_description'] || '';
  ejercicio.nombre = displayName;
  ejercicio.descripcion = rawDesc && rawDesc.trim().length > 0 ? rawDesc : '<i>Sin descripción disponible</i>';
  console.log(`FBP : ejercicio ${i} -> id=${ejercicio.id} titulo='${ejercicio.nombre}' desc_len=${rawDesc ? rawDesc.length : 0} preview='${(rawDesc||'').slice(0,60)}'`);
      this.lista_ejercicios.push(ejercicio);
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
        const resp$ = this.api.obtenerEjercicioInfoPorId(id, lang);
        resp = await lastValueFrom(resp$);
      } catch (err) {
        console.warn('FBP : fallo al obtener description en English para id=', id, err);
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
          const resp3$ = this.api.obtenerEjercicioInfoPorId(id, '1');
          const resp3: any = await lastValueFrom(resp3$);
          if (resp3) resp = resp3;
        } catch (err) {
          console.warn('FBP : fallo al obtener description language=1 para id=', id, err);
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
        message: safeHtml,
        buttons: ['Cerrar']
      });
      await alert.present();
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

