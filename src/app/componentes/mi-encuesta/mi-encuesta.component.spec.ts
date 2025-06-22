import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiEncuestaComponent } from './mi-encuesta.component';

describe('MiEncuestaComponent', () => {
  let component: MiEncuestaComponent;
  let fixture: ComponentFixture<MiEncuestaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiEncuestaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiEncuestaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
