import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Db } from 'src/app/services/db';

@Component({
  selector: 'app-cambiar-contrasena',
  templateUrl: './cambiar-contrasena.page.html',
  styleUrls: ['./cambiar-contrasena.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CambiarContrasenaPage implements OnInit {
  idUsuario: string = '';
  contrasenaActual: string = '';
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';

  mensajeError: string = '';

  constructor(private router: Router, private db: Db) { }

  async ngOnInit() {
    const sesion = await this.db.validarSesion();
    if (sesion && sesion.idusuario) {
      this.idUsuario = sesion.idusuario;
    } else {
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }

  private esContrasenaSegura(contrasena: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(contrasena);
  }

  async cambiarContrasena() {
    this.mensajeError = '';

    if (!this.contrasenaActual || !this.nuevaContrasena || !this.confirmarContrasena) {
      this.mensajeError = 'Por favor, completa todos los campos.';
      return;
    }
    if (this.nuevaContrasena === this.contrasenaActual) {
      this.mensajeError = 'La nueva contraseña no puede ser igual a la actual.';
      return;
    }
    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.mensajeError = 'Las nuevas contraseñas no coinciden.';
      return;
    }
    if (!this.esContrasenaSegura(this.nuevaContrasena)) {
      this.mensajeError = 'La contraseña debe tener: 8+ caracteres, mayúscula, minúscula, número y un carácter especial.';
      return;
    }

    try {
      const esValida = await this.db.validarContrasena(this.idUsuario, this.contrasenaActual);
      if (!esValida) {
        this.mensajeError = 'La contraseña actual es incorrecta.';
        return;
      }

      const actualizado = await this.db.actualizarContrasena(this.idUsuario, this.nuevaContrasena);
      if (actualizado) {
        // Unica y exclusivamente eliminamos la sesión. El AuthGuard hará el resto.
        await this.db.eliminarSesion();

        // Navegamos a la raíz para que el AuthGuard se dispare y redirija a /login
        this.router.navigate(['/'], { replaceUrl: true });

      } else {
        this.mensajeError = 'Ocurrió un error inesperado al actualizar.';
      }
    } catch (error) {
      console.error('FBP: Error en el proceso de cambio de contraseña', error);
      this.mensajeError = 'Error en el servidor. Intente más tarde.';
    }
  }
}
