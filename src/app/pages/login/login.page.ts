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

  constructor(private router: Router, private navCtrl: NavController, private db: Db) {}

  async iniciarSesion() {
    this.mensajeError = '';

    if (!this.usuario || !this.contrasena) {
      this.mensajeError = 'Completa usuario y contraseña.';
      return;
    }

    try {
      const usuarioData = await this.db.loginUsuario(this.usuario, this.contrasena);

      if (usuarioData) {
        
        localStorage.setItem('idUsuario', usuarioData.idusuario); 

        const navigationExtras = {
          state: {
            usuario: usuarioData.nombre,
            contrasena: this.contrasena,
            idusuario: usuarioData.idusuario  
          } 
        };

        
        localStorage.setItem('user', usuarioData.nombre);
        
        this.router.navigate(['/home'], navigationExtras);
        console.log('Inicio de sesión exitoso:', usuarioData.nombre);
      } else {
        this.mensajeError = 'Usuario o contraseña incorrectos.';
      }

    } catch (e) {
      console.error('FBP : Error al iniciar sesión', e);
      this.mensajeError = 'Error al iniciar sesión.';
    }
  }

  registro() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      pageContent.classList.add('slide-out-right');
      setTimeout(() => {
        this.router.navigate(['/registro']);
      }, 500); 
    }
  }
}
