import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BeerDetail } from './beer-detail';

describe('BeerDetail', () => {
  let component: BeerDetail;
  let fixture: ComponentFixture<BeerDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeerDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BeerDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
