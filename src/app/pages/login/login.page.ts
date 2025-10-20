import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { NgIf } from '@angular/common';
import { Db } from 'src/app/services/db';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, NgIf]
})
export class LoginPage {
  usuario: string = '';
  contrasena: string = '';
  mensajeError: string = ''; // NUEVO

  constructor(private router: Router, private navCtrl: NavController, db: Db) {}

  // Método para validar el usuario
  private esUsuarioValido(usuario: string): boolean {
    return usuario.length >= 5; // El usuario debe tener al menos 5 caracteres
  }

  // Método para validar la seguridad de la contraseña
  private esContrasenaValida(contrasena: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(contrasena); // Validar que la contraseña cumpla con los requisitos
  }

  iniciarSesion() {
    const btn = document.getElementById('btn-iniciar');
    this.mensajeError = '';

    // Validar que ambos campos estén llenos
    if (!this.usuario || !this.contrasena) {
      if (btn) {
        btn.classList.remove('scale-anim');
        btn.classList.add('shake-anim');
        setTimeout(() => btn.classList.remove('shake-anim'), 700);
      }
      this.mensajeError = 'Por favor, completa todos los campos.';
      return;
    }

    // Validar que el usuario tenga al menos 5 caracteres
    if (!this.esUsuarioValido(this.usuario)) {
      if (btn) {
        btn.classList.remove('scale-anim');
        btn.classList.add('shake-anim');
        setTimeout(() => btn.classList.remove('shake-anim'), 700);
      }
      this.mensajeError = 'El usuario debe tener al menos 5 caracteres.';
      return;
    }

    // Validar la seguridad de la contraseña
    if (!this.esContrasenaValida(this.contrasena)) {
      if (btn) {
        btn.classList.remove('scale-anim');
        btn.classList.add('shake-anim');
        setTimeout(() => btn.classList.remove('shake-anim'), 700);
      }
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.';
      return;
    }

    // Simular autenticación exitosa
    if (btn) {
      btn.classList.remove('shake-anim');
      btn.classList.add('scale-anim');
      setTimeout(() => btn.classList.remove('scale-anim'), 600);
    }
    this.mensajeError = '';
    this.navCtrl.setDirection('forward');
    this.router.navigate(['/home'], { state: { user: this.usuario } });
  }
  registro() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      // Agregar clase para animación de deslizamiento hacia la derecha
      pageContent.classList.add('slide-out-right');

      // Esperar a que termine la animación antes de navegar
      setTimeout(() => {
        this.router.navigate(['/registro']);
      }, 500); // Duración de la animación (0.5s)
    }
  }
}
