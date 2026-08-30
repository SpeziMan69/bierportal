import { Component, inject } from '@angular/core';
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

  protected readonly beers = this.beerService.getBeers();

  protected searchTerm = '';
  protected selectedType = '';
  protected selectedCountry = '';
  protected selectedSort: BeerSort = 'name-asc';

  protected get beerTypes(): string[] {
    return [...new Set(this.beers.map((beer) => beer.type))].sort((a, b) =>
      a.localeCompare(b, 'de'),
    );
  }

  protected get countries(): string[] {
    return [...new Set(this.beers.map((beer) => beer.country))].sort((a, b) =>
      a.localeCompare(b, 'de'),
    );
  }

  protected get filteredBeers(): Beer[] {
    const normalizedSearch = this.searchTerm.trim().toLocaleLowerCase('de');

    const result = this.beers.filter((beer) => {
      const matchesSearch =
        normalizedSearch === '' ||
        beer.name.toLocaleLowerCase('de').includes(normalizedSearch) ||
        beer.brewery.toLocaleLowerCase('de').includes(normalizedSearch);

      const matchesType = this.selectedType === '' || beer.type === this.selectedType;

      const matchesCountry =
        this.selectedCountry === '' || beer.country === this.selectedCountry;

      return matchesSearch && matchesType && matchesCountry;
    });

    return result.toSorted((firstBeer, secondBeer) => {
      switch (this.selectedSort) {
        case 'rating-desc':
          return secondBeer.rating - firstBeer.rating;

        case 'alcohol-asc':
          return firstBeer.alcohol - secondBeer.alcohol;

        case 'alcohol-desc':
          return secondBeer.alcohol - firstBeer.alcohol;

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

  protected resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedCountry = '';
    this.selectedSort = 'name-asc';
  }
}