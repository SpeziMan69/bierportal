import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BeerCard } from '../../components/beer-card/beer-card';
import type { Beer } from '../../models/beer';
import { BeerService } from '../../services/beer';

type BeerSort = 'name-asc' | 'rating-desc' | 'alcohol-asc' | 'alcohol-desc';

@Component({
  selector: 'app-beer-list',
  imports: [BeerCard, FormsModule],
  templateUrl: './beer-list.html',
  styleUrl: './beer-list.css',
})
export class BeerList {
  private readonly beerService = inject(BeerService);

  protected readonly beers = signal<Beer[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected searchTerm = '';
  protected selectedType = '';
  protected selectedCountry = '';
  protected selectedSort: BeerSort = 'name-asc';
  protected readonly loadingMore = signal(false);
  protected readonly currentPage = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly totalBeers = signal(0);

  private readonly pageSize = 100;

  constructor() {
    this.loadInitialBeers();
  }

  protected get beerTypes(): string[] {
    return [...new Set(this.beers().map((beer) => beer.type))].sort((firstType, secondType) =>
      firstType.localeCompare(secondType, 'de'),
    );
  }

  protected get countries(): string[] {
    return [...new Set(this.beers().map((beer) => beer.country))].sort(
      (firstCountry, secondCountry) => firstCountry.localeCompare(secondCountry, 'de'),
    );
  }

  protected get filteredBeers(): Beer[] {
    const normalizedSearch = this.searchTerm.trim().toLocaleLowerCase('de');

    const result = this.beers().filter((beer) => {
      const matchesSearch =
        normalizedSearch === '' ||
        beer.name.toLocaleLowerCase('de').includes(normalizedSearch) ||
        beer.brewery.toLocaleLowerCase('de').includes(normalizedSearch);

      const matchesType = this.selectedType === '' || beer.type === this.selectedType;

      const matchesCountry = this.selectedCountry === '' || beer.country === this.selectedCountry;

      return matchesSearch && matchesType && matchesCountry;
    });

    return [...result].sort((firstBeer, secondBeer) => {
      switch (this.selectedSort) {
        case 'rating-desc':
          return (secondBeer.rating ?? 0) - (firstBeer.rating ?? 0);

        case 'alcohol-asc':
          return (
            (firstBeer.alcohol ?? Number.POSITIVE_INFINITY) -
            (secondBeer.alcohol ?? Number.POSITIVE_INFINITY)
          );

        case 'alcohol-desc':
          return (
            (secondBeer.alcohol ?? Number.NEGATIVE_INFINITY) -
            (firstBeer.alcohol ?? Number.NEGATIVE_INFINITY)
          );

        case 'name-asc':
        default:
          return firstBeer.name.localeCompare(secondBeer.name, 'de');
      }
    });
  }

  protected get filtersAreActive(): boolean {
    return (
      this.searchTerm.trim() !== '' ||
      this.selectedType !== '' ||
      this.selectedCountry !== '' ||
      this.selectedSort !== 'name-asc'
    );
  }

  protected loadInitialBeers(): void {
    this.loading.set(true);
    this.error.set(null);

    this.beerService.getBeers(1, this.pageSize).subscribe({
      next: (response) => {
        this.beers.set(response.items);
        this.currentPage.set(response.page);
        this.totalPages.set(response.totalPages);
        this.totalBeers.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Die Biere konnten momentan nicht geladen werden.');
        this.loading.set(false);
      },
    });
  }

  protected loadMoreBeers(): void {
    if (this.loadingMore() || !this.canLoadMore) {
      return;
    }

    const nextPage = this.currentPage() + 1;

    this.loadingMore.set(true);

    this.beerService.getBeers(nextPage, this.pageSize).subscribe({
      next: (response) => {
        const uniqueBeers = new Map<string, Beer>();

        for (const beer of [...this.beers(), ...response.items]) {
          uniqueBeers.set(beer.id, beer);
        }

        this.beers.set([...uniqueBeers.values()]);
        this.currentPage.set(response.page);
        this.totalPages.set(response.totalPages);
        this.totalBeers.set(response.total);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  protected get canLoadMore(): boolean {
    return this.currentPage() < this.totalPages();
  }
  protected resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedCountry = '';
    this.selectedSort = 'name-asc';
  }
}
