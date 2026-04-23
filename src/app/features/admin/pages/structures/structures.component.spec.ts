import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StructuresComponent } from './structures.component';

describe('StructuresComponent', () => {
  let component: StructuresComponent;
  let fixture: ComponentFixture<StructuresComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StructuresComponent]
    });
    fixture = TestBed.createComponent(StructuresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
