import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoginPage } from './login.page';


@NgModule({
  imports: [
    LoginPage,

    RouterModule.forChild([
      {
        path: '',
        component: LoginPage
      }
    ])
  ]
})
export class LoginPageModule {}
