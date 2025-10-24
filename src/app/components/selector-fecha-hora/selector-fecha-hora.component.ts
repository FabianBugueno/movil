import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'selector-fecha-hora',
  templateUrl: './selector-fecha-hora.component.html',
  styleUrls: ['./selector-fecha-hora.component.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class DatetimePickerComponent {
  // Variables para fecha, hora (formato HH:mm) y duración
  dateValue: string = new Date().toISOString();
  timeValue: string;
  duracion: number = 60;
  supportsTimeInput: boolean = true;

  constructor(private modalCtrl: ModalController) {
    this.supportsTimeInput = this.checkTimeInputSupport();
    // Inicializar la hora en formato HH:mm
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    this.timeValue = `${hours}:${minutes}`;
  }

  private checkTimeInputSupport(): boolean {
    try {
      const input = document.createElement('input');
      input.setAttribute('type', 'time');
      // Si el navegador/entorno soporta time nativo, la propiedad type se mantiene como 'time'
      return input.type === 'time';
    } catch (e) {
      return false;
    }
  }

  cancel() {
    this.modalCtrl.dismiss();
  }

  confirm() {
    // Parsear la fecha y la hora por separado
    const date = new Date(this.dateValue);
    // Normalizar posibles formatos ("T15:30:00", "15:30:00", "15:30") -> extraer HH:MM
    const normalized = (this.timeValue || '').replace(/^T/, '');
    const parts = normalized.split(':');
    const hours = Number(parts[0] || 0);
    const minutes = Number(parts[1] || 0);

    // Combinar en un solo objeto Date
    const finalDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes
    );

    this.modalCtrl.dismiss({
      start: finalDate.toISOString(),
      duracion: this.duracion
    });
  }
}
