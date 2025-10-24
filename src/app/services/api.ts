import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Api {
  ruta = 'https://wger.de/api/v2/';
  baseUrl = this.ruta; 
  apiKey = '57229188aa3ce03c9c50814ba537249fbf9d53ec';

  categoriasMap: Record<number, string> = {};
  // removed language-specific caching; categories handled locally now

  constructor(private http: HttpClient) {}
  
  // Note: category names are provided from local mapping in src/app/data/exercise-categories.ts

  getCategoriaNombre(id: number | string | undefined): string | null {
    if (id == null) return null;
    const key = typeof id === 'string' ? parseInt(id, 10) : id;
    return this.categoriasMap[key] ?? null;
  }

  /**
   * Obtener exerciseinfo. Si se pasa `language`, el endpoint intentará devolver
   * traducciones para ese idioma (ej: '4' = español).
   */
  obtenerEjerciciosInfo(language?: string, limit = 100): Observable<any> {
    const q = language ? `?language=${language}&limit=${limit}` : `?limit=${limit}`;
    return this.http.get(`${this.ruta}exerciseinfo/${q}`);
  }

  obtenerEjercicioInfoPorId(id: number | string): Observable<any> {
    return this.http.get(`${this.ruta}exerciseinfo/${id}/`);
  }

  obtenerEjercicios(): Observable<any> {
    return this.http.get(this.ruta + 'exercise/');
  }
}

