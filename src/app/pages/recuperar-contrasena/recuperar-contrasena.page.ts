import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Db } from 'src/app/services/db';
import { EmailRecoveryService } from 'src/app/services/email-recovery.service';

@Component({
  selector: 'app-recuperar-contrasena',
  templateUrl: './recuperar-contrasena.page.html',
  styleUrls: ['./recuperar-contrasena.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class RecuperarContrasenaPage implements OnInit {
  // States: 'usuario' (solicitar usuario), 'codigo' (esperar código), 'cambiar' (cambiar contraseña)
  currentStep: 'usuario' | 'codigo' | 'cambiar' = 'usuario';

  // Datos del flujo
  usuarioIngresado: string = '';
  codigoIngresado: string = '';
  usuarioValidado: string = '';
  tokenValidado: string = '';

  // UI
  mensajeError: string = '';
  isLoading: boolean = false;

  // Cambiar contraseña
  nuevaContrasena: string = '';
  confirmarContrasena: string = '';

  constructor(
    private router: Router,
    private db: Db,
    private emailRecovery: EmailRecoveryService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {}

  /**
   * Paso 1: Solicitar usuario y enviar código
   */
  async solicitarCodigo() {
    this.mensajeError = '';
    const usuario = this.usuarioIngresado.trim();

    if (!usuario) {
      this.mensajeError = 'Ingresa tu usuario.';
      return;
    }

    this.isLoading = true;
    try {
      // Verificar que el usuario existe obteniendo su correo
      const correo = await this.db.getCorreoUsuario(usuario);
      if (!correo) {
        this.mensajeError = 'Usuario no encontrado.';
        this.isLoading = false;
        return;
      }

      // Enviar código por email
      await this.emailRecovery.sendRecoveryEmail(usuario);

      // Pasar al siguiente paso
      this.usuarioValidado = usuario;
      this.currentStep = 'codigo';
      this.mensajeError = '';
    } catch (e: any) {
      console.error('FBP: Error solicitando código', e);
      this.mensajeError = e?.message || 'Error al enviar el código. Intente de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Paso 2: Validar código ingresado
   */
  async validarCodigo() {
    this.mensajeError = '';
    const codigo = this.codigoIngresado.trim();

    if (!codigo) {
      this.mensajeError = 'Ingresa el código recibido por correo.';
      return;
    }

    this.isLoading = true;
    try {
      // Buscar usuario por token
      const usuarioByToken = await this.db.getUsuarioByToken(codigo);
      if (!usuarioByToken) {
        this.mensajeError = 'Código inválido o expirado.';
        this.isLoading = false;
        return;
      }

      // Verificar que coincide con el usuario que solicitó
      if (usuarioByToken !== this.usuarioValidado) {
        this.mensajeError = 'El código no coincide con el usuario.';
        this.isLoading = false;
        return;
      }

      // Código válido, ir a cambiar contraseña
      this.tokenValidado = codigo;
      this.currentStep = 'cambiar';
      this.mensajeError = '';
    } catch (e: any) {
      console.error('FBP: Error validando código', e);
      this.mensajeError = 'Error validando el código. Intente de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Paso 3: Cambiar contraseña
   */
  async cambiarContrasena() {
    this.mensajeError = '';

    if (!this.nuevaContrasena || !this.confirmarContrasena) {
      this.mensajeError = 'Por favor, completa los campos de contraseña.';
      return;
    }

    if (this.nuevaContrasena !== this.confirmarContrasena) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.esContrasenaSegura(this.nuevaContrasena)) {
      this.mensajeError = 'La contraseña debe tener: 8+ caracteres, mayúscula, minúscula, número y un carácter especial.';
      return;
    }

    this.isLoading = true;
    try {
      // Actualizar contraseña
      const resultado = await this.db.actualizarContrasena(this.usuarioValidado, this.nuevaContrasena);
      if (!resultado) {
        this.mensajeError = 'Error actualizando la contraseña.';
        this.isLoading = false;
        return;
      }

      // Consumir el token (eliminarlo)
      try {
        await this.db.consumeRecoveryToken(this.tokenValidado);
      } catch (e) {
        // Ignorar si falla la eliminación del token
      }

      // Éxito: mostrar toast y redirigir a login
      const toast = await this.toastCtrl.create({
        message: 'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
        duration: 3000,
        color: 'success'
      });
      await toast.present();

      // Redirigir a login
      this.router.navigate(['/login'], { replaceUrl: true });
    } catch (e: any) {
      console.error('FBP: Error cambiando contraseña', e);
      this.mensajeError = 'Error al cambiar la contraseña. Intente de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Volver al paso anterior
   */
  volver() {
    if (this.currentStep === 'codigo') {
      this.currentStep = 'usuario';
      this.codigoIngresado = '';
      this.mensajeError = '';
    } else if (this.currentStep === 'cambiar') {
      this.currentStep = 'codigo';
      this.nuevaContrasena = '';
      this.confirmarContrasena = '';
      this.mensajeError = '';
    }
  }

  /**
   * Cancelar y volver a login
   */
  cancelar() {
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  /**
   * Validar seguridad de contraseña
   */
  private esContrasenaSegura(contrasena: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(contrasena);
  }
}
