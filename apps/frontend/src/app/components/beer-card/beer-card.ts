import { Component, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Beer } from '../../models/beer';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { BeerStatus } from '@bierportal/dtos';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-beer-card',
  imports: [RouterLink, MediaUrlPipe],
  templateUrl: './beer-card.html',
  styleUrl: './beer-card.css',
})
export class BeerCard {
  @Input({ required: true }) beer!: Beer;

  private readonly userService = inject(UserService);

  readonly BeerStatus = BeerStatus;

  readonly savingStatuses = signal<BeerStatus[]>([]);
  readonly savedStatuses = signal<BeerStatus[]>([]);
  readonly entryError = signal('');

  readonly collectionButtons = [
    {
      status: BeerStatus.WISHLIST,
      label: '+ Zur Wunschliste',
      savedLabel: '✓ Auf der Wunschliste',
    },
    {
      status: BeerStatus.TRIED,
      label: '+ Probiert',
      savedLabel: '✓ Bereits probiert',
    },
    {
      status: BeerStatus.CELLAR,
      label: '+ Im Keller',
      savedLabel: '✓ Im Keller',
    },
  ];

  addToCollection(status: BeerStatus): void {
    if (
      this.savingStatuses().includes(status) ||
      this.savedStatuses().includes(status)
    ) {
      return;
    }

    this.savingStatuses.update((statuses) => [...statuses, status]);
    this.entryError.set('');

    this.userService.addBeer({
      beerId: this.beer.id,
      status,
    }).subscribe({
      next: () => {
        this.savedStatuses.update((statuses) => [...statuses, status]);
        this.savingStatuses.update((statuses) =>
          statuses.filter((value) => value !== status),
        );
      },
      error: () => {
        this.entryError.set(
          'Speichern fehlgeschlagen. Bist du angemeldet?',
        );
        this.savingStatuses.update((statuses) =>
          statuses.filter((value) => value !== status),
        );
      },
    });
  }
}