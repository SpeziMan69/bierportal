import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { CreateReviewDto } from '@bierportal/dtos';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BeerReview {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    picture: string | null;
  } | null;
}

export interface ReviewPage {
  items: BeerReview[];
  page: number;
  totalPages: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reviews`;

  getForBeer(beerId: string, page = 1): Observable<ReviewPage> {
    const params = new HttpParams().set('page', page).set('limit', 3);

    return this.http.get<ReviewPage>(`${this.apiUrl}/beer/${encodeURIComponent(beerId)}`, {
      params,
    });
  }

  create(dto: CreateReviewDto): Observable<BeerReview> {
    return this.http.post<BeerReview>(this.apiUrl, dto);
  }
}
