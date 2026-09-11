import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type { BeerStatus, CreateUserBeerDto, UpdateMeDto } from '@bierportal/dtos';
import { environment } from '../../environments/environment';
import type {
  UpdatedProfile,
  UserBeerEntry,
  UserLike,
  UserProfile,
  UserReview,
} from '../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getProfile(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/users/${encodeURIComponent(id)}`);
  }

  getReviews(id: string): Observable<UserReview[]> {
    return this.http.get<UserReview[]>(`${this.apiUrl}/users/${encodeURIComponent(id)}/reviews`);
  }

  getLikes(id: string): Observable<UserLike[]> {
    return this.http.get<UserLike[]>(`${this.apiUrl}/users/${encodeURIComponent(id)}/likes`);
  }

  updateMe(dto: UpdateMeDto): Observable<UpdatedProfile> {
    return this.http.patch<UpdatedProfile>(`${this.apiUrl}/users/me`, dto);
  }

  uploadAvatar(file: File): Observable<UpdatedProfile> {
    const formData = new FormData();
    formData.append('avatar', file);
    return this.http.post<UpdatedProfile>(`${this.apiUrl}/users/me/avatar`, formData);
  }

  getMyBeers(status?: BeerStatus): Observable<UserBeerEntry[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<UserBeerEntry[]>(`${this.apiUrl}/user-beers`, { params });
  }

  addBeer(dto: CreateUserBeerDto): Observable<UserBeerEntry> {
    return this.http.post<UserBeerEntry>(`${this.apiUrl}/user-beers`, dto);
  }

  removeBeer(entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/user-beers/${encodeURIComponent(entryId)}`);
  }
}
