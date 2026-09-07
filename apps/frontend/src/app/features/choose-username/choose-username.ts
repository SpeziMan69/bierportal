import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../core/auth/auth';

@Component({
  selector: 'app-choose-username',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Choose a username</h1>
        <p class="auth-subtitle">
          Pick a username for your profile. You can always change it later.
        </p>

        <div class="form-group">
          <label class="form-label">Username</label>
          <input
            class="form-input"
            [(ngModel)]="username"
            placeholder="Username"
            type="text"
            [disabled]="loading()"
          />
        </div>

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }

        <button
          class="btn btn-primary"
          (click)="submit()"
          [disabled]="!username.trim() || loading()"
        >
          {{ loading() ? 'Saving...' : 'Continue' }}
        </button>

        <button class="btn btn-ghost" (click)="skip()" [disabled]="loading()">Skip for now</button>
      </div>
    </div>
  `,
  styleUrl: './choose-username.scss',
})
export class ChooseUsername {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  username = '';
  loading = signal(false);
  error = signal<string | null>(null);

  skip(): void {
    void this.router.navigate(['/']);
  }

  submit(): void {
    const trimmed = this.username.trim();
    if (!trimmed) return;

    this.loading.set(true);
    this.error.set(null);

    this.auth.setUsername(trimmed).subscribe({
      next: (user) => {
        this.auth.user.set(user);
        void this.router.navigate(['/']);
      },
      error: () => {
        this.error.set('Username already taken or invalid.');
        this.loading.set(false);
      },
    });
  }
}
