import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Calendar } from '@awesome-cordova-plugins/calendar/ngx';
import { IonicStorageModule } from '@ionic/storage-angular';

import { HomePage } from './home.page';
import { ExerciseCacheService } from 'src/app/services/exercise-cache.service';

describe('Página Home (Principal)', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let cacheSpy: jasmine.SpyObj<ExerciseCacheService>;

  beforeEach(async () => {
    cacheSpy = jasmine.createSpyObj('ExerciseCacheService', ['getAllCachedExercisesSync']);
    cacheSpy.getAllCachedExercisesSync.and.returnValue([
      { id: 1, name: 'Ex1', translations: [{ language: '4', name: 'Ej1', description: 'Desc1' }], category: { id: 1 } }
    ]);

    const spyCalendario = jasmine.createSpyObj('Calendar', ['createEvent', 'hasReadWritePermission', 'requestReadWritePermission']);

    await TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), RouterTestingModule, HomePage, HttpClientTestingModule, IonicStorageModule.forRoot()],
      providers: [
        { provide: ExerciseCacheService, useValue: cacheSpy },
        { provide: Calendar, useValue: spyCalendario }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe cargar ejercicios desde la caché local', async () => {
    await component.ejerciciosListar();
    expect(component.lista_ejercicios.length).toBeGreaterThan(0);
    expect(component.lista_ejercicios[0].nombre).toContain('Ej1');
  });
});
