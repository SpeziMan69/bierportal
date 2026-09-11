import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfileReviews } from './profile-reviews';

describe('ProfileReviews', () => {
  let component: ProfileReviews;
  let fixture: ComponentFixture<ProfileReviews>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileReviews],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileReviews);
    fixture.componentRef.setInput('userId', 'user-1');
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
