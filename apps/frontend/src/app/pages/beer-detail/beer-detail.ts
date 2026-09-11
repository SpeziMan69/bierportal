import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BeerService } from '../../services/beer';
import type { Beer } from '../../models/beer';
import { MediaUrlPipe } from '../../shared/pipes/media-url.pipe';

@Component({
  selector: 'app-beer-detail',
  imports: [RouterLink, MediaUrlPipe],
  templateUrl: './beer-detail.html',
  styleUrl: './beer-detail.css',
})
export class BeerDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly beerService = inject(BeerService);

  protected readonly beer = signal<Beer | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

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
}
