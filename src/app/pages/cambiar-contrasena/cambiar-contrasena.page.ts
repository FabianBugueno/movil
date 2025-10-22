import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';
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
    this.usuario = extras.extras.state['usuario'];           
    this.contrasena = extras.extras.state['contrasena'];
    
    const idusuario = extras.extras.state['idusuario'] || localStorage.getItem('idUsuario');
    if (idusuario) {  
      this.usuario = idusuario;
    }
  } else {
    
    const idusuario = localStorage.getItem('idUsuario');
    if (idusuario) this.usuario = idusuario;
  }
}
  
  cambiarContrasena(){
    this.db.cambiarContrasena(this.usuario, this.contrasena, this.contrasenaNueva);
    
    let extras: NavigationExtras = {
      replaceUrl: true
    }
    
    this.router.navigate(['/login', extras]); 

    
  }
}
