import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Db } from 'src/app/services/db';

@Component({
  selector: 'app-bienvenida',
  templateUrl: './bienvenida.page.html',
  styleUrls: ['./bienvenida.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class BienvenidaPage implements OnInit {
  checking = true; // indica que estamos validando la sesión

  constructor(private db: Db, private router: Router) { }
  
  ngOnInit() {
    // Validar sesión antes de renderizar el contenido para evitar parpadeos
    this.db.validarSesion()
      .then((data: any) => {
        this.checking = false;
        // validarSesion devuelve el registro de sesión o null
        if (data) {
          // reemplaza la ruta actual para evitar que el historial muestre primero bienvenida
          this.router.navigate(['/home'], { replaceUrl: true });
        } else {
          this.router.navigate(['/login'], { replaceUrl: true });
        }
      })
      .catch((e) => {
        console.error('Error verificando sesión en bienvenida:', e);
        this.checking = false;
        // ante error, redirigir a login por seguridad
        this.router.navigate(['/login'], { replaceUrl: true });
      });
  }

}
