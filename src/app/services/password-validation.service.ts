import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn, FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class PasswordValidationService {
  
  passwordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return { required: true };
      }

      const errors: ValidationErrors = {};
      
      if (value.length < 8) {
        errors['minLength'] = true;
      }
      
      if (!/[A-Z]/.test(value)) {
        errors['upperCase'] = true;
      }
      
      if (!/[a-z]/.test(value)) {
        errors['lowerCase'] = true;
      }
      
      if (!/[0-9]/.test(value)) {
        errors['number'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  confirmPasswordValidator(passwordKey: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }
      
      const password = control.parent.get(passwordKey);
      const confirmPassword = control.value;
      
      if (!confirmPassword) {
        return { required: true };
      }
      
      if (password && password.value !== confirmPassword) {
        return { mismatch: true };
      }
      
      return null;
    };
  }

  getPasswordErrors(control: AbstractControl): string[] {
    const errors: string[] = [];

    if (!control) return errors;

    const currentErrors = control.errors;
    if (!currentErrors) return errors;

    if (currentErrors['required']) {
      errors.push('Este campo es obligatorio');
    }
    
    if (currentErrors['minLength']) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (currentErrors['upperCase']) {
      errors.push('La contraseña debe contener al menos una mayúscula');
    }
    
    if (currentErrors['lowerCase']) {
      errors.push('La contraseña debe contener al menos una minúscula');
    }
    
    if (currentErrors['number']) {
      errors.push('La contraseña debe contener al menos un número');
    }
    
    if (currentErrors['mismatch']) {
      errors.push('Las contraseñas no coinciden');
    }

    return errors;
  }

  validateForm(form: FormGroup): string[] {
    if (!form.valid) {
      const errors: string[] = [];
      
      // Contraseña actual
      const currentPassword = form.get('currentPassword');
      if (currentPassword?.errors) {
        if (currentPassword.errors['required']) {
          errors.push('La contraseña actual es obligatoria');
        }
      }

      // Nueva contraseña
      const newPassword = form.get('newPassword');
      if (newPassword?.errors) {
        errors.push(...this.getPasswordErrors(newPassword));
      }

      // Confirmar contraseña
      const confirmPassword = form.get('confirmPassword');
      if (confirmPassword?.errors) {
        errors.push(...this.getPasswordErrors(confirmPassword));
      }

      return errors;
    }
    return [];
  }
}