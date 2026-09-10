import { Component, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user';
import type { UserLike } from '../../../models/user';

@Component({
  selector: 'app-profile-likes',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './profile-likes.html',
  styleUrl: './profile-likes.scss',
})
export class ProfileLikes {
  private readonly userService = inject(UserService);

  readonly userId = input.required<string>();

  protected readonly likes = signal<UserLike[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getLikes(this.userId()).subscribe({
      next: (likes) => {
        this.likes.set(likes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Deine Likes konnten nicht geladen werden.');
        this.loading.set(false);
      },
    });
  }
}
