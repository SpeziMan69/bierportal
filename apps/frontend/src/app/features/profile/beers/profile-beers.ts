import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BeerStatus } from '@bierportal/dtos';
import { MediaUrlPipe } from '../../../shared/pipes/media-url.pipe';
import { UserService } from '../../../services/user';
import type { UserBeerEntry } from '../../../models/user';

@Component({
  selector: 'app-profile-beers',
  standalone: true,
  imports: [RouterLink, MediaUrlPipe],
  templateUrl: './profile-beers.html',
  styleUrl: './profile-beers.scss',
})
export class ProfileBeers {
  private readonly userService = inject(UserService);

  protected readonly BeerStatus = BeerStatus;
  protected readonly filter = signal<BeerStatus>(BeerStatus.WISHLIST);
  protected readonly entries = signal<UserBeerEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly removingIds = signal<string[]>([]);
  protected readonly removeError = signal('');


  protected readonly filters: { value: BeerStatus; label: string }[] = [
    { value: BeerStatus.WISHLIST, label: 'Wunschliste' },
    { value: BeerStatus.TRIED, label: 'Probiert' },
    { value: BeerStatus.CELLAR, label: 'Keller' },
  ];

  constructor() {
    this.load();
  }

  protected setFilter(filter: BeerStatus): void {
    if (this.filter() === filter) {
      return;
    }
    this.filter.set(filter);
    this.load();
  }

  protected statusLabel(status: BeerStatus): string {
    return this.filters.find((f) => f.value === status)?.label ?? status;
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getMyBeers(this.filter()).subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Deine Biere konnten nicht geladen werden.');
        this.loading.set(false);
      },
    });
  }

  protected removeEntry(entryId: string): void {
    if (this.removingIds().includes(entryId)) return;

    this.removingIds.update((ids) => [...ids, entryId]);
    this.removeError.set('');

    this.userService.removeBeer(entryId).subscribe({
      next: () => {
        this.entries.update((entries) =>
          entries.filter((entry) => entry.id !== entryId),
         );
        this.removingIds.update((ids) =>
          ids.filter((id) => id !== entryId),
        );
      },
      error: () => {
        this.removeError.set(
          'Entfernen fehlgeschlagen. Bitte versuche es erneut.',
        );
        this.removingIds.update((ids) =>
          ids.filter((id) => id !== entryId),
        );
      },
    });
  }
}
