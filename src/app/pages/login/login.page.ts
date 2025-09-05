import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule]
})
export class LoginPage {
  usuario : string = "";
  contrasena : string = "";

  constructor (private router: Router){

  }
  registro(){
    this.router.navigate(['/registro']);
  }
  ingresar(){
    let extras: NavigationExtras = {
      replaceUrl: true,
      state: {
        user: this.usuario,
        pass: this.contrasena
      }
    };

    this.router.navigate(['/home'], extras);
  }
}
