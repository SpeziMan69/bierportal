import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BeerService } from '../../services/beer';
import type { Beer } from '../../models/beer';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';
import { BeerStatus } from '@bierportal/dtos';
import { UserService } from '../../services/user';
import { BeerReviews } from '../../components/beer-reviews/beer-reviews';

@Component({
  selector: 'app-beer-detail',
  imports: [RouterLink, MediaUrlPipe, BeerReviews],
  templateUrl: './beer-detail.html',
  styleUrl: './beer-detail.scss',
})
export class BeerDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly beerService = inject(BeerService);
  private readonly userService = inject(UserService);

  protected readonly beer = signal<Beer | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

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

  ngOnInit(): void {
    this.loadBeer();
  }

  protected loadBeer(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Es wurde keine gültige Bier-ID angegeben.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.beerService.getBeerById(id).subscribe({
      next: (beer) => {
        this.beer.set(beer);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Dieses Bier wurde nicht gefunden oder konnte nicht geladen werden.');
        this.loading.set(false);
      },
    });
  }

  addToCollection(status: BeerStatus): void {
    const beer = this.beer();
    if (!beer) return;
    if (this.savingStatuses().includes(status) || this.savedStatuses().includes(status)) {
      return;
    }

    this.savingStatuses.update((statuses) => [...statuses, status]);
    this.entryError.set('');

    this.userService
      .addBeer({
        beerId: beer.id,
        status,
      })
      .subscribe({
        next: () => {
          this.savedStatuses.update((statuses) => [...statuses, status]);
          this.savingStatuses.update((statuses) => statuses.filter((value) => value !== status));
        },
        error: () => {
          this.entryError.set('Speichern fehlgeschlagen. Bist du angemeldet?');
          this.savingStatuses.update((statuses) => statuses.filter((value) => value !== status));
        },
      });
  }
}
