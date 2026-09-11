import { Component, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../services/user';
import type { UserReview } from '../../../models/user';

@Component({
  selector: 'app-profile-reviews',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './profile-reviews.html',
  styleUrl: './profile-reviews.scss',
})
export class ProfileReviews implements OnInit {
  private readonly userService = inject(UserService);

  readonly userId = input.required<string>();

  protected readonly reviews = signal<UserReview[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getReviews(this.userId()).subscribe({
      next: (reviews) => {
        this.reviews.set(reviews);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Deine Bewertungen konnten nicht geladen werden.');
        this.loading.set(false);
      },
    });
  }
}
