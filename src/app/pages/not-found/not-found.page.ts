import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class NotFoundPage {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  async irInicio() {
    const estaLogeado = await this.authService.isLoggedIn();
    if (estaLogeado) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
