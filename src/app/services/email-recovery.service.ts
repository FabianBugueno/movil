import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { Db } from './db';

@Injectable({
  providedIn: 'root'
})
export class EmailRecoveryService {
  private serviceId = '';
  private templateId = '';
  private publicKey = '';
  private isInitialized = false;

  constructor(private db: Db) {}

  /**
   * Configura las credenciales de EmailJS (llamar una vez en la app).
   */
  setCredentials(serviceId: string, templateId: string, publicKey: string) {
    try {
      this.serviceId = serviceId;
      this.templateId = templateId;
      this.publicKey = publicKey;
      emailjs.init(publicKey);
      this.isInitialized = true;
      console.log('EmailJS initialized successfully');
    } catch (e) {
      console.error('Error initializing EmailJS:', e);
    }
  }

  /**
   * Envía un correo de recuperación automáticamente.
   */
  async sendRecoveryEmail(usuario: string): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('EmailJS no está inicializado. Espera a que la app se cargue.');
    }

    // Obtener correo del usuario desde BD local
    const correo = await this.db.getCorreoUsuario(usuario);
    if (!correo) {
      throw new Error('No se encontró el correo asociado al usuario.');
    }

    // Generar token simple y guardarlo en BD con expiración (1 hora)
    const token = Math.random().toString(36).substring(2, 12).toUpperCase();
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hora

    // Guardar token en BD local
    await this.db.saveRecoveryToken(usuario, token, expiresAt);

    // Enviar el token en el email (plantilla debe usar {{token}})
    const templateParams = {
      token: token,
      email: correo,
      expiryMinutes: 60
    };

    try {
      console.log('Sending email with params:', templateParams);
      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );
      console.log('Recovery email sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending recovery email:', error);
      throw error;
    }
  }
}
