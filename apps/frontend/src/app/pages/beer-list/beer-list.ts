import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BeerCard } from '../../components/beer-card/beer-card';
import type { Beer } from '../../models/beer';
import { BeerService, type BeerFilters } from '../../services/beer';

type BeerSort = 'name-asc' | 'rating-desc' | 'alcohol-asc' | 'alcohol-desc';

@Component({
  selector: 'app-beer-list',
  imports: [BeerCard, FormsModule],
  templateUrl: './beer-list.html',
})
export class BeerList implements OnInit, OnDestroy {
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

  private readonly pageSize = 24;

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadInitialBeers();
  }

  protected readonly beerTypes = signal<string[]>([]);
  protected readonly countries = signal<string[]>([]);
  protected readonly filterError = signal('');
  protected readonly moreError = signal('');
  private request?: Subscription;
  private optionsRequest?: Subscription;
  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
    this.request?.unsubscribe();
    this.optionsRequest?.unsubscribe();
  }

  protected loadFilterOptions(): void {
    this.optionsRequest?.unsubscribe();
    this.filterError.set('');
    this.optionsRequest = this.beerService.getFilterOptions().subscribe({
      next: (options) => {
        this.beerTypes.set(options.styles);
        this.countries.set(options.countries);
      },
      error: () => this.filterError.set('Filteroptionen konnten nicht geladen werden.'),
    });
  }

  protected searchChanged(value: string): void {
    this.searchTerm = value;
    clearTimeout(this.searchTimer);
    this.request?.unsubscribe();
    this.loading.set(true);
    this.loadingMore.set(false);
    this.searchTimer = setTimeout(() => this.loadInitialBeers(), 300);
  }

  private get currentFilters(): BeerFilters {
    return {
      q: this.searchTerm,
      style: this.selectedType,
      country: this.selectedCountry,
      sort: this.selectedSort,
    };
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
    clearTimeout(this.searchTimer);
    this.request?.unsubscribe();
    this.loadingMore.set(false);
    this.beers.set([]);
    this.currentPage.set(0);
    this.totalPages.set(0);
    this.totalBeers.set(0);
    this.moreError.set('');
    this.loading.set(true);
    this.error.set(null);

    this.request = this.beerService.getBeers(1, this.pageSize, this.currentFilters).subscribe({
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
    if (this.loading() || this.loadingMore() || !this.canLoadMore) {
      return;
    }

    const nextPage = this.currentPage() + 1;

    this.loadingMore.set(true);
    this.moreError.set('');

    this.request = this.beerService
      .getBeers(nextPage, this.pageSize, this.currentFilters)
      .subscribe({
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
          this.moreError.set('Weitere Biere konnten nicht geladen werden. Bitte erneut versuchen.');
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
    this.loadInitialBeers();
  }
}
