import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Db } from './db';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PasswordRecoveryService {
  private apiBase = (environment as any).apiUrl || 'http://localhost:3000';

  constructor(private http: HttpClient, private db: Db) {}

  async requestRecovery(usuario: string): Promise<any> {
    // Buscar correo asociado en BD local
    const correo = await this.db.getCorreoUsuario(usuario);
    if (!correo) {
      throw new Error('No se encontró el correo asociado al usuario.');
    }

    const payload = { username: usuario, email: correo };

    return this.http.post(`${this.apiBase}/api/recovery`, payload).toPromise();
  }
}
