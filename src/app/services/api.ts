import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Api {

  ruta = 'https://wger.de/api/v2/';
  // Base URL (puede usarse como prefijo) y API key para autenticación
  baseUrl = this.ruta; // incluye la barra final
  apiKey = '57229188aa3ce03c9c50814ba537249fbf9d53ec';

  constructor (private http: HttpClient) { }
  
  obtenerEjercicios() {
    return this.http.get(this.ruta + 'exercise/').pipe();
  }
  
  // Devuelve la información detallada de ejercicios (incluye descripción)
  obtenerEjerciciosInfo(language?: string, limit?: number) {
    let url = this.ruta + 'exerciseinfo/';
    const params: string[] = [];
    if (language) params.push(`language=${encodeURIComponent(language)}`);
    if (limit) params.push(`limit=${encodeURIComponent(String(limit))}`);
    if (params.length) url += `?${params.join('&')}`;
    return this.http.get(url).pipe();
  }

  // Obtener la info detallada de un ejercicio por su id (útil para peticiones bajo demanda)
  obtenerEjercicioInfoPorId(id: number | string, language?: string) {
    let url = this.ruta + `exerciseinfo/${id}/`;
    if (language) url += `?language=${encodeURIComponent(language)}`;
    return this.http.get(url).pipe();
  }
  ejercicioAlmacenar(ejercicio: any): Observable<any> {
    const url = `${this.ruta}exercise/`;

    const headers = new HttpHeaders({
      'Authorization': `Token ${this.apiKey}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(url, ejercicio, { headers });
  }
}

