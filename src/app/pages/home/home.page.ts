import { Component, OnInit } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule]
})
export class HomePage implements OnInit {
  usuario: string = '';
  contrasena: string = '';

  constructor(private router: Router, private navCtrl: NavController) {}

  ngOnInit() {
    
    const navigation = this.router.getCurrentNavigation();
    // intento obtener usuario desde navigation state; si no existe, fallback a localStorage
    const stateUsuario = navigation?.extras?.state?.['usuario'];
    const stateContrasena = navigation?.extras?.state?.['contrasena'];
    const stored = localStorage.getItem('user');

    if (stateUsuario) {
      this.usuario = stateUsuario;
      this.contrasena = stateContrasena || '';
      console.log('Usuario recibido desde el state:', this.usuario);
    } else if (stored) {
      this.usuario = stored;
      console.log('Usuario recuperado desde localStorage:', this.usuario);
    } else {
      console.warn('No se recibió usuario en el state ni en localStorage. Redirigiendo al login...');
      this.router.navigate(['/login']);
    }
  }

  cerrarSesion() {
    
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      pageContent.classList.add('slide-out-left');

      setTimeout(() => {
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      }, 500);
    } else {
      localStorage.removeItem('user');
      this.router.navigate(['/login']);
    }
  }
  navegarCambiarContrasena() {
  let extras:  NavigationExtras ={
    state: { 
            usuario: this.usuario,
            contrasena: this.contrasena
           }

  } 
  this.navCtrl.navigateForward('/cambiar-contrasena', extras);
  } 
}
