import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BienvenidaPage } from './bienvenida.page';

describe('Página Bienvenida', () => {
  let component: BienvenidaPage;
  let fixture: ComponentFixture<BienvenidaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BienvenidaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });
});
