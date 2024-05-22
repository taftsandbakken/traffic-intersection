import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedestrianButtonComponent } from './pedestrian-button.component';

describe('PedestrianButtonComponent', () => {
  let component: PedestrianButtonComponent;
  let fixture: ComponentFixture<PedestrianButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedestrianButtonComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PedestrianButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
