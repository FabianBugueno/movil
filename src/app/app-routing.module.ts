import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'bienvenida',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule),
    canActivate: [LoginGuard]
  },
  {
    path: 'registro',
    loadChildren: () => import('./pages/registro/registro.module').then( m => m.RegistroPageModule),
    canActivate: [LoginGuard]
  },
  {
    path: 'cambiar-contrasena',
    loadChildren: () => import('./pages/cambiar-contrasena/cambiar-contrasena.module').then( m => m.CambiarContrasenaPageModule)
  },
  {
    path: 'bienvenida',
    loadChildren: () => import('./pages/bienvenida/bienvenida.module').then( m => m.BienvenidaPageModule)
  },
  {
    path: 'rutinas',
    loadComponent: () => import('./pages/rutinas/rutinas.page').then(m => m.RutinasPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'rutinas/crear',
    loadComponent: () => import('./components/formulario-rutina/formulario-rutina.component').then(m => m.FormRutinaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'rutinas/:id',
    loadComponent: () => import('./components/detalle-rutina/detalle-rutina.component').then(m => m.DetalleRutinaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'rutinas/editar/:id',
    loadComponent: () => import('./components/formulario-rutina/formulario-rutina.component').then(m => m.FormRutinaComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPage)
  },
  {
    path: '**',
    redirectTo: 'not-found'
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
