import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaisonniersValidationComponent } from './saisonniers-validation.component';

describe('SaisonniersValidationComponent', () => {
  let component: SaisonniersValidationComponent;
  let fixture: ComponentFixture<SaisonniersValidationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SaisonniersValidationComponent]
    });
    fixture = TestBed.createComponent(SaisonniersValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
