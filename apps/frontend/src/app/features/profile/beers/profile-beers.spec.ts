import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfileBeers } from './profile-beers';

describe('ProfileBeers', () => {
  let component: ProfileBeers;
  let fixture: ComponentFixture<ProfileBeers>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileBeers],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileBeers);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
