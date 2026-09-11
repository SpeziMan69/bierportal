import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ProfileOverview } from './profile-overview';
import type { UserProfile } from '../../../models/user';

describe('ProfileOverview', () => {
  let component: ProfileOverview;
  let fixture: ComponentFixture<ProfileOverview>;

  const profile: UserProfile = {
    id: 'user-1',
    username: 'tester',
    picture: null,
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    likeCount: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileOverview],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileOverview);
    fixture.componentRef.setInput('profile', profile);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
