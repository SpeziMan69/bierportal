import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfileLikes } from './profile-likes';

describe('ProfileLikes', () => {
  let component: ProfileLikes;
  let fixture: ComponentFixture<ProfileLikes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileLikes],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileLikes);
    fixture.componentRef.setInput('userId', 'user-1');
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
