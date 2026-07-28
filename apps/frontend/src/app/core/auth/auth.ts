import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  isUsernameSet: boolean;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  user = signal<AuthUser | null>(null);

  login(identifier: string, password: string): Observable<AuthUser> {
    return this.http.post<AuthUser>(
      `${this.apiUrl}/login`,
      { identifier, password },
      // withCredentials kommt vom Interceptor
    );
  }

  loginOrRegisterWithGoogle(): void {
    globalThis.location.href = `${environment.apiUrl}/auth/google`;
  }

  setUsername(username: string): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${this.apiUrl}/set-username`, { username });
  }

  logout(): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/logout`, {});
  }

  loadProfile(): Observable<AuthUser | null> {
    return this.http.get<AuthUser>(`${this.apiUrl}/profile`).pipe(
      tap((user) => this.user.set(user)),
      catchError(() => {
        this.user.set(null);
        return of(null);
      }),
    );
  }
}

export function initAuth(): Observable<AuthUser | null> {
  return inject(Auth).loadProfile();
}
