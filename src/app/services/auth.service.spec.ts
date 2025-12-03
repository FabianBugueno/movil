import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Db } from './db';

describe('Servicio de Autenticación', () => {
  let service: AuthService;
  let dbSpy: jasmine.SpyObj<Db>;

  beforeEach(() => {
    dbSpy = jasmine.createSpyObj('Db', ['validarSesion', 'almacenarSesion', 'eliminarSesion', 'validarContrasena', 'actualizarContrasena']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Db, useValue: dbSpy }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('debe crear el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('debe guardar la sesión y reflejar estado autenticado', async () => {
    dbSpy.almacenarSesion.and.returnValue(Promise.resolve(true) as any);
    await service.guardarSesion('u1', 'p', 'Juan');
    const conectado = await service.isLoggedIn();
    expect(conectado).toBeTrue();
  });

  it('debe retornar falso cuando valida contraseña sin sesión', async () => {
    dbSpy.validarSesion.and.returnValue(Promise.resolve(null) as any);
    // limpiar localStorage
    localStorage.removeItem('idUsuario');
    const resultado = await service.validateCurrentPassword('x');
    expect(resultado).toBeFalse();
  });

  it('debe cambiar contraseña cuando la contraseña actual es válida', async () => {
    // simular sesión via validarSesion
    dbSpy.validarSesion.and.returnValue(Promise.resolve({ idusuario: 'u1', contrasena: 'p' } as any));
    dbSpy.validarContrasena.and.returnValue(Promise.resolve(true) as any);
    dbSpy.actualizarContrasena.and.returnValue(Promise.resolve(true) as any);
    dbSpy.eliminarSesion.and.returnValue(Promise.resolve(true) as any);

    const resultado = await service.changePassword('p', 'nuevacontraseña');
    expect(resultado.success).toBeTrue();
  });
});
