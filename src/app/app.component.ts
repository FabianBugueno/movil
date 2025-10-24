import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private platform: Platform) {
    this.initializeApp();
  }

  private async initializeApp() {
    await this.platform.ready();

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
  }
}
