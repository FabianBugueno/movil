import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule]
})
export class LoginPage {
  usuario: string = '';
  contrasena: string = '';

  constructor(private router: Router, private navCtrl: NavController) {}

  // Método para validar el usuario
  private esUsuarioValido(usuario: string): boolean {
    return usuario.length >= 5; // El usuario debe tener al menos 5 caracteres
  }

  // Método para validar la seguridad de la contraseña
  private esContrasenaValida(contrasena: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(contrasena); // Validar que la contraseña cumpla con los requisitos
  }

  iniciarSesion() {
    // Validar que ambos campos estén llenos
    if (!this.usuario || !this.contrasena) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    // Validar que el usuario tenga al menos 5 caracteres
    if (!this.esUsuarioValido(this.usuario)) {
      alert('El usuario debe tener al menos 5 caracteres.');
      return;
    }

    // Validar la seguridad de la contraseña
    if (!this.esContrasenaValida(this.contrasena)) {
      alert(
        'La contraseña debe tener al menos 8 caracteres, incluyendo una letra mayúscula, una letra minúscula, un número y un carácter especial.'
      );
      return;
    }

    // Simular autenticación exitosa
    console.log('Inicio de sesión exitoso:', this.usuario);

    // Establecer animación de slide hacia la derecha
    this.navCtrl.setDirection('forward');
    this.router.navigate(['/home'], { state: { user: this.usuario } });
  }
  registro() {
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
      // Agregar clase para animación de deslizamiento hacia la derecha
      pageContent.classList.add('slide-out-right');

      // Esperar a que termine la animación antes de navegar
      setTimeout(() => {
        this.router.navigate(['/registro']);
      }, 500); // Duración de la animación (0.5s)
    }
  }
}
