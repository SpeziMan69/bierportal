import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private count = 0;
  private readonly loading$ = new BehaviorSubject<boolean>(false);
  isLoading$ = this.loading$.asObservable();

  show(): void {
    this.count++;
    this.loading$.next(true);
  }

  hide(): void {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) this.loading$.next(false);
  }
}
