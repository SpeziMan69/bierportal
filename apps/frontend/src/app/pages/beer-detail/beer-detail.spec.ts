import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BeerDetail } from './beer-detail';

describe('BeerDetail', () => {
  let component: BeerDetail;
  let fixture: ComponentFixture<BeerDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeerDetail],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BeerDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
