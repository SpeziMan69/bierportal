import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Auth } from '../../core/auth/auth';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { UserService } from '../../services/user';
import type { UpdatedProfile, UserProfile } from '../../models/user';
import { ProfileOverview } from './overview/profile-overview';
import { ProfileReviews } from './reviews/profile-reviews';
import { ProfileLikes } from './likes/profile-likes';
import { ProfileBeers } from './beers/profile-beers';
import { ProfileDanger } from './danger/profile-danger';

type ProfileTab = 'overview' | 'reviews' | 'likes' | 'beers' | 'danger';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    DatePipe,
    MediaUrlPipe,
    ProfileOverview,
    ProfileReviews,
    ProfileLikes,
    ProfileBeers,
    ProfileDanger,
  ],
  templateUrl: './profile.html',
})
export class Profile {
  protected readonly auth = inject(Auth);
  private readonly userService = inject(UserService);

  protected readonly activeTab = signal<ProfileTab>('overview');
  protected readonly profile = signal<UserProfile | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.loadProfile();
  }

  protected setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  protected loadProfile(): void {
    const id = this.auth.user()?.id;
    if (!id) {
      this.error.set('Du bist nicht angemeldet.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.userService.getProfile(id).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Dein Profil konnte nicht geladen werden.');
        this.loading.set(false);
      },
    });
  }

  protected onProfileUpdated(updated: UpdatedProfile): void {
    const current = this.profile();
    if (current) {
      this.profile.set({ ...current, ...updated });
    }

    const authUser = this.auth.user();
    if (authUser) {
      this.auth.user.set({ ...authUser, username: updated.username });
    }
  }

  protected initial(username: string): string {
    return username.charAt(0).toUpperCase();
  }
}
