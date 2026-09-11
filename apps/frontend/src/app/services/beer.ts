import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Beer } from '../models/beer';

export interface BeerPage {
  items: Beer[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface BeerFilters {
  q?: string;
  style?: string;
  country?: string;
  sort?: 'name-asc' | 'rating-desc' | 'alcohol-asc' | 'alcohol-desc';
}
export interface BeerFilterOptions {
  styles: string[];
  countries: string[];
}

@Injectable({ providedIn: 'root' })
export class BeerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/beers`;

  getBeers(page = 1, limit = 24, filters: BeerFilters = {}): Observable<BeerPage> {
    let params = new HttpParams().set('page', page).set('limit', limit);

    for (const key of ['q', 'style', 'country', 'sort'] as const) {
      const value = filters[key];
      if (value?.trim()) {
        params = params.set(key, value.trim());
      }
    }

    return this.http.get<BeerPage>(this.apiUrl, { params });
  }

  getFilterOptions(): Observable<BeerFilterOptions> {
    return this.http.get<BeerFilterOptions>(`${this.apiUrl}/filters`);
  }

  getBeerById(id: string): Observable<Beer> {
    return this.http.get<Beer>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }
}
