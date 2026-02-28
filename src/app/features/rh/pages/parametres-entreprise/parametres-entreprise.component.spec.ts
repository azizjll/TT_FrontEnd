import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParametresEntrepriseComponent } from './parametres-entreprise.component';

describe('ParametresEntrepriseComponent', () => {
  let component: ParametresEntrepriseComponent;
  let fixture: ComponentFixture<ParametresEntrepriseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ParametresEntrepriseComponent]
    });
    fixture = TestBed.createComponent(ParametresEntrepriseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
