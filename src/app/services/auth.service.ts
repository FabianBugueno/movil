import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Db } from './db';

export interface Session {
  idusuario: string;
  contrasena?: string;
}

export interface PasswordChangeResult {
  success: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authState = new BehaviorSubject<boolean>(false);
  public authState$ = this.authState.asObservable();

  constructor(private db: Db) {
    this.init();
  }

  private async init(): Promise<void> {
    try {
      const s = await this.getSession();
      this.authState.next(!!s);
    } catch {
      this.authState.next(false);
    }
  }

  async guardarSesion(idUsuario: string, contrasena: string, nombre?: string): Promise<void> {
    await this.db.almacenarSesion(idUsuario, contrasena);
    localStorage.setItem('idUsuario', idUsuario);
    if (nombre) localStorage.setItem('user', nombre);
    this.authState.next(true);
  }

  async getSession(): Promise<Session | null> {
    try {
      const s: any = await this.db.validarSesion();
      if (s && s.idusuario) return { idusuario: s.idusuario, contrasena: s.contrasena };
      const id = localStorage.getItem('idUsuario');
      if (id) return { idusuario: id };
      return null;
    } catch {
      const id = localStorage.getItem('idUsuario');
      return id ? { idusuario: id } : null;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const s = await this.getSession();
    return !!s;
  }

  async validateCurrentPassword(currentPassword: string): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session?.idusuario) {
        return false;
      }
      
      return await this.db.validarContrasena(session.idusuario, currentPassword);
    } catch (error) {
      console.error('Error validando contraseña actual:', error);
      return false;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<PasswordChangeResult> {
    try {
      const session = await this.getSession();
      if (!session?.idusuario) {
        return {
          success: false,
          message: 'No hay una sesión activa'
        };
      }

      // Validar contraseña actual
      const isCurrentPasswordValid = await this.validateCurrentPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'La contraseña actual es incorrecta'
        };
      }

      // Actualizar contraseña en la base de datos
      const updated = await this.db.actualizarContrasena(session.idusuario, newPassword);
      if (!updated) {
        return {
          success: false,
          message: 'Error al actualizar la contraseña en la base de datos'
        };
      }

      // Cerrar sesión después de cambiar la contraseña
      await this.cerrarSesion();
      
      return {
        success: true,
        message: 'Contraseña actualizada correctamente. Por favor, inicie sesión nuevamente.'
      };
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      return {
        success: false,
        message: 'Error al cambiar la contraseña'
      };
    }
  }

  async cerrarSesion(): Promise<void> {
    try {
      await this.db.eliminarSesion();
    } catch {
    }
    localStorage.removeItem('idUsuario');
    localStorage.removeItem('user');
    this.authState.next(false);
  }
}
