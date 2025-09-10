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
      pageContent.classList.add('slide-out-left');
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 500);
    }
  }
}
