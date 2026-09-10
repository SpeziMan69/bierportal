import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BeerStatus } from '@bierportal/dtos';
import { MediaUrlPipe } from '../../../shared/pipes/media-url.pipe';
import { UserService } from '../../../services/user';
import type { UserBeerEntry } from '../../../models/user';

type StatusFilter = BeerStatus | 'all';

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
  protected readonly filter = signal<StatusFilter>('all');
  protected readonly entries = signal<UserBeerEntry[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: BeerStatus.TRIED, label: 'Probiert' },
    { value: BeerStatus.WISHLIST, label: 'Wunschliste' },
    { value: BeerStatus.CELLAR, label: 'Keller' },
  ];

  constructor() {
    this.load();
  }

  protected setFilter(filter: StatusFilter): void {
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

    const active = this.filter();
    const status = active === 'all' ? undefined : active;

    this.userService.getMyBeers(status).subscribe({
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
}
