import { Component, DestroyRef, Input, OnChanges, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  private readonly router = inject(Router);
  private likeRequests = new Subscription();
  protected readonly liking = signal<string[]>([]);
  protected readonly likeErrors = signal<Record<string, string>>({});
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
    this.likeRequests.unsubscribe();
    this.likeRequests = new Subscription();
    this.liking.set([]);
    this.likeErrors.set({});
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

  protected toggleLike(review: BeerReview): void {
    const user = this.auth.user();
    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }
    if (review.user?.id === user.id || this.liking().includes(review.id)) return;
    this.liking.update((ids) => [...ids, review.id]);
    this.likeErrors.update((errors) => ({ ...errors, [review.id]: '' }));
    const request = review.likedByMe
      ? this.reviewService.unlike(review.id)
      : this.reviewService.like(review.id);
    this.likeRequests.add(
      request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (result) => {
          this.reviews.update((reviews) =>
            reviews.map((item) =>
              item.id === review.id
                ? { ...item, likedByMe: result.liked, likeCount: result.likeCount }
                : item,
            ),
          );
          this.liking.update((ids) => ids.filter((id) => id !== review.id));
        },
        error: (error: HttpErrorResponse) => {
          this.liking.update((ids) => ids.filter((id) => id !== review.id));
          if (error.status === 409 || error.status === 404) {
            this.load(this.page());
            return;
          }
          this.likeErrors.update((errors) => ({
            ...errors,
            [review.id]:
              error.status === 401
                ? 'Bitte melde dich erneut an.'
                : 'Like konnte nicht gespeichert werden. Bitte erneut versuchen.',
          }));
        },
      }),
    );
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
