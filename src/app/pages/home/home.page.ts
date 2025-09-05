import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  usuario: string = "";
  contrasena: string = "";

  constructor(private router: Router) {}
  ngOnInit() {
    let extras = this.router.getCurrentNavigation();
    if (extras?.extras.state) {
      this.usuario = extras.extras.state['user'];
    }
  }
}
