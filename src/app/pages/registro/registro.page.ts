import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, NgIf]
})
export class RegistroPage {
  usuario: string = '';
  nombre: string = '';
  apellidos: string = '';
  correo: string = '';
  contrasena: string = '';
  mensajeError: string = ''; // <-- Agrega esta línea

  constructor(private router: Router, private navCtrl: NavController) {}

  // Método para validar el formato del correo
  private esCorreoValido(correo: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión regular para validar correos
    return regex.test(correo);
  }

  // Método para validar la seguridad de la contraseña
  private esContrasenaSegura(contrasena: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(contrasena);
  }

  registrarse() {
    this.mensajeError = ''; // Limpiar mensaje

    // Validar que todos los campos estén llenos
    if (!this.usuario || !this.nombre || !this.apellidos || !this.correo || !this.contrasena) {
      this.mensajeError = 'Por favor, completa todos los campos.';
      return;
    }

    // Validar el formato del correo
    if (!this.esCorreoValido(this.correo)) {
      this.mensajeError = 'El correo electrónico no tiene un formato válido.';
      return;
    }

    // Validar la seguridad de la contraseña
    if (!this.esContrasenaSegura(this.contrasena)) {
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial.';
      return;
    }

    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      // Agregar clase para animación de deslizamiento hacia la derecha
      pageContent.classList.add('slide-out-right');

      // Esperar a que termine la animación antes de navegar
      setTimeout(() => {
        const navigationExtras = {
          state: {
            user: this.nombre
          }
        };
        this.router.navigate(['/home'], navigationExtras);
        console.log('Usuario registrado:', this.nombre);
      }, 500); // Duración de la animación (0.5s)
    }
  }

  irALogin() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      // Agregar clase para animación de deslizamiento hacia la izquierda
      pageContent.classList.add('slide-out-left');

      // Esperar a que termine la animación antes de navegar
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 500); // Duración de la animación (0.5s)
    }
  }
}
