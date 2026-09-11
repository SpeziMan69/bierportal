import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BeerReviews } from './beer-reviews';

describe('BeerReviews', () => {
  let component: BeerReviews;
  let fixture: ComponentFixture<BeerReviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeerReviews],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BeerReviews);
    component = fixture.componentInstance;
    component.beerId = 'test-beer-id';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
