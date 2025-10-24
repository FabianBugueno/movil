import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { NgIf, CommonModule } from '@angular/common'; // Import CommonModule here
import { Db } from 'src/app/services/db';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, NgIf, CommonModule]
})
export class LoginPage implements OnInit {
  usuario: string = '';
  contrasena: string = '';
  mensajeError: string = '';
  mensajeExito: string = ''; // Para el mensaje de éxito
  showPassword = false;

  constructor(private router: Router, private navCtrl: NavController, private db: Db, private auth: AuthService) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['mensajeExito']) {
      this.mensajeExito = navigation.extras.state['mensajeExito'];
    }
  }

  ngOnInit() {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async iniciarSesion() {
    this.mensajeError = '';
    this.mensajeExito = ''; // Limpiar mensajes al intentar iniciar sesión

    if (!this.usuario || !this.contrasena) {
      this.mensajeError = 'Completa usuario y contraseña.';
      return;
    }

    try {
      const usuarioData = await this.db.loginUsuario(this.usuario, this.contrasena);

      if (usuarioData) {
        await this.auth.guardarSesion(usuarioData.idusuario, usuarioData.contrasena, usuarioData.nombre);

        const navigationExtras = {
          state: {
            usuario: usuarioData.nombre,
            contrasena: this.contrasena,
            idusuario: usuarioData.idusuario
          }
        };

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
