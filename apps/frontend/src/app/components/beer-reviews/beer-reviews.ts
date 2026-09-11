import { Component, DestroyRef, Input, OnChanges, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { Auth } from '../../core/auth/auth';
import { ReviewService, type BeerReview } from '../../services/review';

@Component({
  selector: 'app-beer-reviews',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './beer-reviews.html',
  styleUrl: './beer-reviews.css',
})
export class BeerReviews implements OnChanges {
  @Input({ required: true }) beerId!: string;

  protected readonly auth = inject(Auth);
  private readonly reviewService = inject(ReviewService);
  private readonly destroyRef = inject(DestroyRef);
  private listRequest?: Subscription;
  private saveRequest?: Subscription;

  protected readonly reviews = signal<BeerReview[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly success = signal('');
  protected readonly page = signal(1);
  protected readonly totalPages = signal(0);

  protected text = '';
  protected rating: number | null = null;

  ngOnChanges(): void {
    this.saveRequest?.unsubscribe();
    this.saving.set(false);
    this.page.set(1);
    this.totalPages.set(0);
    this.text = '';
    this.rating = null;
    this.success.set('');
    this.saveError.set('');
    this.reviews.set([]);
    this.load(1);
  }

  protected load(page = 1): void {
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.loadError.set('');

    this.listRequest = this.reviewService
      .getForBeer(this.beerId, page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.reviews.set(result.items);
          this.page.set(result.page);
          this.totalPages.set(result.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set('Kommentare konnten nicht geladen werden.');
          this.loading.set(false);
        },
      });
  }

  protected submit(): void {
    const text = this.text.trim();
    const rating = this.rating;

    if (
      this.saving() ||
      !this.auth.user() ||
      !text ||
      text.length > 2000 ||
      rating === null ||
      !Number.isFinite(rating) ||
      rating < 0.5 ||
      rating > 5 ||
      !Number.isInteger(rating * 2)
    ) {
      return;
    }

    this.saving.set(true);
    this.saveError.set('');
    this.success.set('');

    this.saveRequest = this.reviewService
      .create({
        beerId: this.beerId,
        rating,
        text,
        isDraft: false,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.text = '';
          this.rating = null;
          this.saving.set(false);
          this.success.set('Dein Review wurde veröffentlicht.');
          this.load(1);
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          this.saveError.set(
            error.status === 409
              ? 'Du hast dieses Bier bereits bewertet.'
              : error.status === 401
                ? 'Bitte melde dich erneut an.'
                : 'Speichern fehlgeschlagen. Bitte versuche es erneut.',
          );
        },
      });
  }
}
