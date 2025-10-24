import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { PasswordValidationService } from '../../services/password-validation.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'cambiar-contrasena',
  templateUrl: './cambiar-contrasena.component.html',
  styleUrls: ['./cambiar-contrasena.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private passwordValidation: PasswordValidationService,
    private authService: AuthService,
    private alertController: AlertController,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        this.passwordValidation.passwordValidator()
      ]],
      confirmPassword: ['']  // Los validadores se añaden después
    });

    this.changePasswordForm.get('confirmPassword')?.setValidators([
      Validators.required,
      this.passwordValidation.confirmPasswordValidator('newPassword')
    ]);

    this.changePasswordForm.get('newPassword')?.valueChanges.subscribe(() => {
      this.changePasswordForm.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  ngOnInit() {}

  get currentPassword() { return this.changePasswordForm.get('currentPassword'); }
  get newPassword() { return this.changePasswordForm.get('newPassword'); }
  get confirmPassword() { return this.changePasswordForm.get('confirmPassword'); }

  async onSubmit() {
    this.changePasswordForm.markAllAsTouched();
    const formErrors = this.passwordValidation.validateForm(this.changePasswordForm);
    if (formErrors.length > 0) {
      await this.showError(formErrors.join('\n'));
      return;
    }

    try {
      const result = await this.authService.changePassword(
        this.currentPassword?.value || '',
        this.newPassword?.value || ''
      );

      if (!result.success) {
        await this.showError(result.message);
        return;
      }

      await this.showSuccess(result.message);
      await this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Error al cambiar la contraseña:', error);
      await this.showError('Error al cambiar la contraseña. Por favor, intente nuevamente.');
    }
  }

  getPasswordErrors(): string[] {
    const control = this.changePasswordForm.get('newPassword');
    return control ? this.passwordValidation.getPasswordErrors(control) : [];
  }

  getConfirmPasswordErrors(): string[] {
    const control = this.changePasswordForm.get('confirmPassword');
    return control ? this.passwordValidation.getPasswordErrors(control) : [];
  }

  getFormErrors(): string[] {
    return this.passwordValidation.validateForm(this.changePasswordForm);
  }

  private async showSuccess(message: string) {
    const alert = await this.alertController.create({
      header: 'Éxito',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showError(message: string) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: message,
      cssClass: 'error-alert',
      buttons: [{
        text: 'OK',
        role: 'cancel',
        cssClass: 'error-button'
      }]
    });
    await alert.present();
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }
}
