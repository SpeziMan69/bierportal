import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BeerList } from './beer-list';

describe('BeerList', () => {
  let component: BeerList;
  let fixture: ComponentFixture<BeerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BeerList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(BeerList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
