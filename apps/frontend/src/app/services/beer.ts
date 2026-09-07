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

@Injectable({
  providedIn: 'root',
})
export class BeerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/beers`;

  getBeers(page = 1, limit = 24): Observable<BeerPage> {
    const params = new HttpParams().set('page', page).set('limit', limit);

    return this.http.get<BeerPage>(this.apiUrl, { params });
  }

  getBeerById(id: string): Observable<Beer> {
    return this.http.get<Beer>(`${this.apiUrl}/${encodeURIComponent(id)}`);
  }
}
