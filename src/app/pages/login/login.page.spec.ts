import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginPage } from './login.page';
import { IonicModule, NavController } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { Db } from 'src/app/services/db';
import { AuthService } from 'src/app/services/auth.service';
import { AlertController, ToastController } from '@ionic/angular';

describe('Página Login', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let dbSpy: jasmine.SpyObj<Db>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let navSpy: jasmine.SpyObj<NavController>;

  beforeEach(async () => {
    dbSpy = jasmine.createSpyObj('Db', ['loginUsuario']);
    authSpy = jasmine.createSpyObj('AuthService', ['guardarSesion']);
    navSpy = jasmine.createSpyObj('NavController', ['navigateForward']);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), RouterTestingModule, /* componente standalone */ LoginPage],
      providers: [
        { provide: Db, useValue: dbSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: NavController, useValue: navSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar error cuando los campos están vacíos', async () => {
    component.usuario = '';
    component.contrasena = '';
    await component.iniciarSesion();
    expect(component.mensajeError).toContain('Completa usuario');
  });

  it('debe llamar a loginUsuario y guardarSesion cuando las credenciales son válidas', async () => {
    dbSpy.loginUsuario.and.returnValue(Promise.resolve({ idusuario: 'u1', contrasena: 'p', nombre: 'Test' } as any));
    component.usuario = 'u1';
    component.contrasena = 'p';

    await component.iniciarSesion();

    expect(dbSpy.loginUsuario).toHaveBeenCalledWith('u1', 'p');
    expect(authSpy.guardarSesion).toHaveBeenCalled();
  });

  it('debe mostrar error cuando las credenciales son inválidas', async () => {
    dbSpy.loginUsuario.and.returnValue(Promise.resolve(null));
    component.usuario = 'u1';
    component.contrasena = 'incorrecta';

    await component.iniciarSesion();
    expect(component.mensajeError).toContain('Usuario o contraseña incorrectos');
  });
});

signingConfigs {
    release {
        storeFile file('../../fitplan-release-key.keystore')
        storePassword 'TU_CONTRASEÑA_AQUI'
        keyAlias 'fitplan-key'
        keyPassword 'TU_CONTRASEÑA_AQUI'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
