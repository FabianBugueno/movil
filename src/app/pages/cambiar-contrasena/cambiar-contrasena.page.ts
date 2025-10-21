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
  usuario: string = '';
  contrasena: string = '';
  contrasenaNueva: string = '';
  contrasenaActual: string = '';
  confirmarContrasena: string = '';
  

  constructor(private router: Router, private db : Db) { }

  ngOnInit() {
  let extras = this.router.getCurrentNavigation();
  if (extras?.extras.state) {
    this.usuario = extras.extras.state['usuario'];           // nombre del usuario (para mostrar)
    this.contrasena = extras.extras.state['contrasena'];
    // 🔹 NUEVO: guardar el idusuario real
    const idusuario = extras.extras.state['idusuario'] || localStorage.getItem('idUsuario');
    if (idusuario) {
      this.usuario = idusuario; // 👈 ahora this.usuario será el id real usado en BD
    }
  } else {
    // Si no hay navegación, intento recuperar desde localStorage
    const idusuario = localStorage.getItem('idUsuario');
    if (idusuario) this.usuario = idusuario;
  }
}
  
  cambiarContrasena(){
    this.db.cambiarContrasena(this.usuario, this.contrasena, this.contrasenaNueva);
    this.router.navigate(['/login']); 
    
  }
}
