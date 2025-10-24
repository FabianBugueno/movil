import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {
  constructor(private router: Router, private auth: AuthService) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const logged = await this.auth.isLoggedIn();
    if (logged) return this.router.createUrlTree(['/home']);
    return true;
  }
}
