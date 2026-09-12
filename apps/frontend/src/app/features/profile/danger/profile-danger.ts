import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../../core/auth/auth';

@Component({
  selector: 'app-profile-danger',
  standalone: true,
  imports: [],
  templateUrl: './profile-danger.html',
})
export class ProfileDanger {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  protected readonly confirming = signal(false);
  protected readonly deleting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected startConfirm(): void {
    this.confirming.set(true);
    this.error.set(null);
  }

  protected cancel(): void {
    this.confirming.set(false);
  }

  protected deleteAccount(): void {
    this.deleting.set(true);
    this.error.set(null);

    this.auth.deleteAccount().subscribe({
      next: () => {
        this.auth.user.set(null);
        void this.router.navigate(['/']);
      },
      error: () => {
        this.deleting.set(false);
        this.error.set('Dein Konto konnte nicht gelöscht werden. Bitte versuche es erneut.');
      },
    });
  }
}
