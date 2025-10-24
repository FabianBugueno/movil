import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Rutina, RutinaDto } from '../models/rutina.interface';
import { AuthService } from './auth.service';
import { Calendar } from '@awesome-cordova-plugins/calendar/ngx';

@Injectable({
  providedIn: 'root'
})
export class RutinaService {
  private STORAGE_KEY = 'rutinas';
  private rutinasSubject = new BehaviorSubject<Rutina[]>([]);
  rutinas$ = this.rutinasSubject.asObservable();

  constructor(
    private storage: Storage,
    private authService: AuthService,
    private calendar: Calendar
  ) {
    this.init();
  }

  private async init() {
    await this.storage.create();
    await this.cargarRutinas();
    
    // Recargar rutinas cuando cambie el estado de autenticación
    this.authService.authState$.subscribe(async (loggedIn) => {
      if (loggedIn) {
        await this.cargarRutinas();
      } else {
        this.rutinasSubject.next([]);
      }
    });
  }

  private async cargarRutinas() {
    const session = await this.authService.getSession();
    if (!session?.idusuario) {
      this.rutinasSubject.next([]);
      return;
    }

    const todasLasRutinas = (await this.storage.get(this.STORAGE_KEY) || []) as Rutina[];
    const rutinasDelUsuario = todasLasRutinas.filter(
      (rutina: Rutina) => rutina.usuarioId === session.idusuario
    );
    this.rutinasSubject.next(rutinasDelUsuario);
  }

  getRutinas(): Observable<Rutina[]> {
    return this.rutinas$;
  }

  getRutinaById(id: number): Observable<Rutina | undefined> {
    return this.rutinas$.pipe(
      map(rutinas => rutinas.find(r => r.id === id))
    );
  }

  async agregarRutina(rutinaDto: RutinaDto): Promise<Rutina> {
    try {
      const session = await this.authService.getSession();
      if (!session?.idusuario) {
        throw new Error('Usuario no autenticado');
      }

      const todasLasRutinas = await this.storage.get(this.STORAGE_KEY) || [];
      const nuevaRutina: Rutina = {
        ...rutinaDto,
        id: Date.now(),
        fechaCreacion: new Date(),
        usuarioId: session.idusuario
      };
      
      const nuevasRutinas = [...todasLasRutinas, nuevaRutina];
      await this.storage.set(this.STORAGE_KEY, nuevasRutinas);
      
      // Actualizar el BehaviorSubject solo con las rutinas del usuario actual
      const rutinasActuales = this.rutinasSubject.value;
      this.rutinasSubject.next([...rutinasActuales, nuevaRutina]);
      
      // Intentar crear un evento en el calendario nativo (no bloquear la creación si falla)
      this.tryCreateCalendarEventForRutina(nuevaRutina).catch(err => {
        console.error('Error creando evento de calendario (no bloqueante):', err);
      });

      return nuevaRutina;
    } catch (error) {
      console.error('Error al agregar rutina:', error);
      throw new Error('No se pudo agregar la rutina');
    }
  }

  private async ensureCalendarPermission(): Promise<boolean> {
    try {
      // Prefer wrapper API
      if (this.calendar && typeof this.calendar.hasReadWritePermission === 'function') {
        const has = await this.calendar.hasReadWritePermission();
        if (has) return true;
        const granted = await this.calendar.requestReadWritePermission();
        return !!granted;
      }

      // Fallback: try older methods via global plugin
      const win = window as any;
      const cal = (win && win.cordova && win.cordova.plugins && win.cordova.plugins.calendar) || (win && win.plugins && win.plugins.calendar);
      if (!cal) return false;
      if (typeof cal.hasReadWritePermission === 'function') {
        const has = await cal.hasReadWritePermission();
        if (has) return true;
        const granted = await cal.requestReadWritePermission();
        return !!granted;
      }
      if (typeof cal.hasReadPermission === 'function') {
        const has = await cal.hasReadPermission();
        if (has) return true;
        const granted = await cal.requestReadPermission();
        return !!granted;
      }
      return false;
    } catch (error) {
      console.error('Error comprobando/solicitando permiso de calendario:', error);
      return false;
    }
  }

  // No longer using global plugin accessor; prefer injected wrapper. Keep fallbacks in ensureCalendarPermission and methods below.

  private formatEjerciciosAsNotes(ejercicios: any[] | undefined): string {
    if (!ejercicios || !Array.isArray(ejercicios) || ejercicios.length === 0) return '';
    return ejercicios.map((e: any, i: number) => {
      const nombre = e?.nombre || e?.name || `Ejercicio ${i + 1}`;
      return `- ${nombre}`;
    }).join('\n');
  }

  private async tryCreateCalendarEventForRutina(rutina: Rutina, startOverride?: Date, duracionMinutos: number = 60): Promise<void> {
    try {
      const permission = await this.ensureCalendarPermission();
      if (!permission) {
        console.warn('Permiso de calendario no concedido, se omite la creación del evento.');
        return;
      }

      const start = startOverride || (rutina.fechaCreacion ? new Date(rutina.fechaCreacion) : new Date());
      const end = new Date(start.getTime() + duracionMinutos * 60 * 1000); // duración en minutos
      const title = rutina.nombre || 'Rutina FitPlan';
      const location = 'FitPlan';
      const notes = this.formatEjerciciosAsNotes(rutina.ejercicios);
      // Try to use injected wrapper if available
      if (this.calendar && typeof this.calendar.createEvent === 'function') {
        // wrapper returns a Promise
        await this.calendar.createEvent(title, location, notes, start, end);
      } else {
        // fallback to global plugin
        const win = window as any;
        const cal = (win && win.cordova && win.cordova.plugins && win.cordova.plugins.calendar) || (win && win.plugins && win.plugins.calendar);
        if (!cal) {
          console.warn('Plugin de calendario no disponible en tiempo de ejecución.');
        } else if (typeof cal.createEvent === 'function') {
          const res = cal.createEvent(title, location, notes, start, end);
          if (res && typeof res.then === 'function') {
            await res;
          } else {
            await new Promise((resolve, reject) => {
              try {
                cal.createEvent(title, location, notes, start, end, resolve, reject);
              } catch (e) {
                reject(e);
              }
            });
          }
        } else {
          console.warn('Método createEvent no disponible en el plugin de calendario.');
        }
      }

      // Actualizar la rutina almacenada con información del evento
      const todas = (await this.storage.get(this.STORAGE_KEY)) || [];
      const index = (todas as Rutina[]).findIndex((r: Rutina) => r.id === rutina.id);
      if (index !== -1) {
        const updated: Rutina = {
          ...(todas as Rutina[])[index],
          calendarEvent: {
            title,
            location,
            notes,
            startDate: start.toISOString(),
            endDate: end.toISOString()
          }
        };
        const nuevas = [
          ...((todas as Rutina[]).slice(0, index)),
          updated,
          ...((todas as Rutina[]).slice(index + 1))
        ];
        await this.storage.set(this.STORAGE_KEY, nuevas);

        // Actualizar BehaviorSubject local si corresponde
        const rutinasActuales = this.rutinasSubject.value;
        const idxActual = rutinasActuales.findIndex(r => r.id === rutina.id);
        if (idxActual !== -1) {
          this.rutinasSubject.next([
            ...rutinasActuales.slice(0, idxActual),
            updated,
            ...rutinasActuales.slice(idxActual + 1)
          ]);
        }
      }
    } catch (error) {
      console.error('Error al crear evento en calendario:', error);
      // No lanzar: la creación del evento no debe bloquear la creación de la rutina
    }
  }

  async editarRutina(rutina: Rutina): Promise<void> {
    try {
      const session = await this.authService.getSession();
      if (!session?.idusuario) {
        throw new Error('Usuario no autenticado');
      }

      // Verificar que la rutina pertenezca al usuario actual
      if (rutina.usuarioId !== session.idusuario) {
        throw new Error('No tienes permiso para editar esta rutina');
      }

      const todasLasRutinas = (await this.storage.get(this.STORAGE_KEY) || []) as Rutina[];
      const index = todasLasRutinas.findIndex((r: Rutina) => r.id === rutina.id);
      
      if (index === -1) {
        throw new Error('Rutina no encontrada');
      }

      const nuevasRutinas = [
        ...todasLasRutinas.slice(0, index),
        rutina,
        ...todasLasRutinas.slice(index + 1)
      ];

      await this.storage.set(this.STORAGE_KEY, nuevasRutinas);
      
      // Actualizar el BehaviorSubject solo con las rutinas del usuario actual
      const rutinasActuales = this.rutinasSubject.value;
      const indexActual = rutinasActuales.findIndex((r: Rutina) => r.id === rutina.id);
      if (indexActual !== -1) {
        this.rutinasSubject.next([
          ...rutinasActuales.slice(0, indexActual),
          rutina,
          ...rutinasActuales.slice(indexActual + 1)
        ]);
      }

      // Si la rutina ya tenía un evento de calendario, intentar actualizarlo (borrar + crear nuevo con misma o nueva fecha)
      try {
        const todas = (await this.storage.get(this.STORAGE_KEY)) || [];
        const orig = (todas as Rutina[]).find(r => r.id === rutina.id) as Rutina | undefined;
        // borrar evento previo si existía
        if (orig?.calendarEvent) {
          try {
            const hasPerm = await this.ensureCalendarPermission();
            if (hasPerm) {
              if (this.calendar && typeof this.calendar.deleteEvent === 'function') {
                const start = new Date(orig.calendarEvent.startDate);
                const end = new Date(orig.calendarEvent.endDate);
                await this.calendar.deleteEvent(orig.calendarEvent.title, orig.calendarEvent.location || null, orig.calendarEvent.notes || null, start, end);
              } else {
                const win = window as any;
                const cal = (win && win.cordova && win.cordova.plugins && win.cordova.plugins.calendar) || (win && win.plugins && win.plugins.calendar);
                if (cal && typeof cal.deleteEvent === 'function') {
                  const start = new Date(orig.calendarEvent.startDate);
                  const end = new Date(orig.calendarEvent.endDate);
                  const res = cal.deleteEvent(orig.calendarEvent.title, orig.calendarEvent.location || null, orig.calendarEvent.notes || null, start, end);
                  if (res && typeof res.then === 'function') await res;
                }
              }
            }
          } catch (e) {
            console.warn('No se pudo borrar evento anterior al actualizar (no bloqueante):', e);
          }
        }

        // Crear nuevo evento usando la fecha de la rutina (si existe) o ahora
        await this.tryCreateCalendarEventForRutina(rutina);
      } catch (e) {
        console.error('Error sincronizando evento de calendario al editar rutina:', e);
      }
    } catch (error) {
      console.error('Error al editar rutina:', error);
      throw new Error('No se pudo editar la rutina');
    }
  }

  async eliminarRutina(id: number): Promise<void> {
    try {
      const session = await this.authService.getSession();
      if (!session?.idusuario) {
        throw new Error('Usuario no autenticado');
      }

      const todasLasRutinas = (await this.storage.get(this.STORAGE_KEY) || []) as Rutina[];
      const rutina = todasLasRutinas.find((r: Rutina) => r.id === id);

      if (!rutina) {
        throw new Error('Rutina no encontrada');
      }

      // Verificar que la rutina pertenezca al usuario actual
      if (rutina.usuarioId !== session.idusuario) {
        throw new Error('No tienes permiso para eliminar esta rutina');
      }

      // Intentar eliminar el evento del calendario si existe (no bloquear si falla)
      if (rutina.calendarEvent) {
        try {
          const permission = await this.ensureCalendarPermission();
          if (!permission) {
            console.warn('Permiso de calendario no concedido, omitiendo eliminación del evento.');
          } else {
            const ce = rutina.calendarEvent;
            if (!ce) {
              console.warn('No hay metadata de evento de calendario en la rutina.');
            } else {
              // Prefer wrapper
              if (this.calendar && typeof this.calendar.deleteEvent === 'function') {
                const start = new Date(ce.startDate);
                const end = new Date(ce.endDate);
                try {
                  await this.calendar.deleteEvent(ce.title, ce.location || null, ce.notes || null, start, end);
                } catch (e) {
                  console.warn('Error al borrar evento con wrapper:', e);
                }
              } else {
                // Fallback global plugin
                const win = window as any;
                const cal = (win && win.cordova && win.cordova.plugins && win.cordova.plugins.calendar) || (win && win.plugins && win.plugins.calendar);
                if (cal && typeof cal.deleteEvent === 'function') {
                  const start = new Date(ce.startDate);
                  const end = new Date(ce.endDate);
                  const res = cal.deleteEvent(ce.title, ce.location || null, ce.notes || null, start, end);
                  if (res && typeof res.then === 'function') await res;
                  else await new Promise((resolve, reject) => {
                    try {
                      cal.deleteEvent(ce.title, ce.location || null, ce.notes || null, start, end, resolve, reject);
                    } catch (err) {
                      reject(err);
                    }
                  });
                } else {
                  console.warn('Plugin de calendario no disponible o no soporta deleteEvent.');
                }
              }
            }
          }
        } catch (err) {
          console.error('Error eliminando evento de calendario (no bloqueante):', err);
        }
      }

      const nuevasRutinas = todasLasRutinas.filter((r: Rutina) => r.id !== id);
      await this.storage.set(this.STORAGE_KEY, nuevasRutinas);
      
      // Actualizar el BehaviorSubject solo con las rutinas del usuario actual
      const rutinasActuales = this.rutinasSubject.value;
      this.rutinasSubject.next(rutinasActuales.filter((r: Rutina) => r.id !== id));
    } catch (error) {
      console.error('Error al eliminar rutina:', error);
      throw new Error('No se pudo eliminar la rutina');
    }
  }

  /**
   * Método público de utilidad para crear (de nuevo) el evento de calendario
   * asociado a una rutina existente. Útil para pruebas manuales.
   */
  async crearEventoParaRutina(rutinaId: number, start?: Date, duracionMinutos: number = 60): Promise<void> {
    const todasLasRutinas = (await this.storage.get(this.STORAGE_KEY) || []) as Rutina[];
    const rutina = todasLasRutinas.find(r => r.id === rutinaId);
    if (!rutina) throw new Error('Rutina no encontrada');
    await this.tryCreateCalendarEventForRutina(rutina, start, duracionMinutos);
  }
}