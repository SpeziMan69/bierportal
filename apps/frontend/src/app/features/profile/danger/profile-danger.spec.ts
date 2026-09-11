import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfileDanger } from './profile-danger';

describe('ProfileDanger', () => {
  let component: ProfileDanger;
  let fixture: ComponentFixture<ProfileDanger>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileDanger],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileDanger);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
