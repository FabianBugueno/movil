import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule] // Asegúrate de que IonicModule esté incluido aquí
})
export class HomePage {
  usuario: string = '';

  constructor(private router: Router, private navCtrl: NavController) {}

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.usuario = navigation.extras.state['user'];
    }
  }

  cerrarSesion() {
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
