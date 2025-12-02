import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { EmailRecoveryService } from './services/email-recovery.service';
import { ExerciseCacheService } from './services/exercise-cache.service';
import { App as CapacitorApp } from '@capacitor/app';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private platform: Platform, private emailRecovery: EmailRecoveryService, private exerciseCache: ExerciseCacheService, private router: Router) {
    this.initializeApp();
  }

  private async initializeApp() {
    await this.platform.ready();

    // Configurar EmailJS
    this.emailRecovery.setCredentials(
      'service_iqbuxpo',
      'template_7tx2eso',
      'nkOOJq94sPDh7or3E'
    );

    // Dynamically import Capacitor StatusBar to avoid issues when running in web
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      // Set a matching background color (same as banner gradient start)
      await StatusBar.setBackgroundColor({ color: '#7b00ff' });
      // Use dark icons on light background when supported
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (e) {
      // plugin not available (web or missing plugin) — ignore
      console.debug('StatusBar not available:', e);
    }

    // Listen for app deep links (custom scheme) and navigate accordingly
    try {
      CapacitorApp.addListener('appUrlOpen', (data: any) => {
        // data.url contains the full URL that opened the app
        console.log('App opened with URL:', data.url);
        try {
          const url = new URL(data.url);
          // Example: fitplan://cambiar-contrasena?user=usuario&token=abc
          if (url.pathname && url.pathname.includes('cambiar-contrasena')) {
            const params = new URLSearchParams(url.search);
            const user = params.get('user');
            const token = params.get('token');
            // navigate to cambiar-contrasena passing query params
            this.router.navigate(['/cambiar-contrasena'], { queryParams: { user, token } });
          }
        } catch (e) {
          console.error('Error parsing appUrlOpen:', e);
        }
      });
    } catch (e) {
      console.warn('Capacitor App plugin not available or listener failed:', e);
    }

    // Preload exercises cache in background
    try {
      this.exerciseCache.preloadExercises().catch(e => console.warn('Preload exercises failed', e));
      // When app comes to foreground, refresh cache in background if stale
      try {
        CapacitorApp.addListener('appStateChange', (state: any) => {
          if (state && state.isActive) {
            try {
              if (this.exerciseCache.shouldRefresh()) {
                this.exerciseCache.refreshCache().then(() => console.log('ExerciseCache: background refresh finished')).catch(e => console.warn('ExerciseCache: refresh on resume failed', e));
              }
            } catch(e) { /* ignore */ }
          }
        });
      } catch(e) { console.warn('App state listener not available', e); }
    } catch (e) {
      console.warn('ExerciseCache preload error', e);
    }
  }
}
