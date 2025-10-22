import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { NgIf } from '@angular/common';
import { Db } from 'src/app/services/db';

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
  mensajeError: string = ''; 

  constructor(private router: Router, private navCtrl: NavController, private db: Db) {}

 
  private esCorreoValido(correo: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
    return regex.test(correo);
  }

  
  private esContrasenaSegura(contrasena: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(contrasena);
  }

  async registrarse() {
    this.mensajeError = ''; 

    if (!this.usuario || !this.nombre || !this.apellidos || !this.correo || !this.contrasena) {
      this.mensajeError = 'Por favor, completa todos los campos.';
      return;
    }

    if (!this.esCorreoValido(this.correo)) {
      this.mensajeError = 'El correo electrónico no tiene un formato válido.';
      return;
    }

    if (!this.esContrasenaSegura(this.contrasena)) {
      this.mensajeError = 'La contraseña debe tener al menos 8 caracteres, una letra mayúscula, una letra minúscula, un número y un carácter especial.';
      return;
    }

    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      pageContent.classList.add('slide-out-right');

      try {
        await this.db.almacenarUsuario(this.usuario, this.nombre, this.apellidos, this.correo, this.contrasena);
        // Después de registrar también persistimos la sesión y guardamos el nombre en localStorage
        await this.db.almacenarSesion(this.usuario, this.contrasena);
        localStorage.setItem('user', this.nombre);
        localStorage.setItem('idUsuario', this.usuario);
        setTimeout(() => {
          // usamos la clave 'usuario' (la que espera Home) para mantener consistencia
          const navigationExtras = { state: { usuario: this.nombre, contrasena: this.contrasena, idusuario: this.usuario } };
          this.router.navigate(['/home'], navigationExtras);
          console.log('Usuario registrado y sesión iniciada:', this.nombre);
        }, 500);
      } catch (e: any) {
        console.error('Error al guardar usuario:', e);
        // Mostrar solo el mensaje de error lanzado desde el servicio (por ejemplo "El usuario ya existe")
        this.mensajeError = e?.message || 'Error al guardar usuario';
      }
    }
  }

  irALogin() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      
      pageContent.classList.add('slide-out-left');

      
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 500);  
    }
  }
}
