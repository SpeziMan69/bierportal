import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title">Sign up for free</h1>

        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" [(ngModel)]="username" placeholder="Username" type="text" />
        </div>

        <div class="form-group">
          <label class="form-label">Email address</label>
          <input class="form-input" [(ngModel)]="email" placeholder="Email address" type="email" />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" [(ngModel)]="password" placeholder="Password" type="password" />
        </div>

        <div class="form-group">
          <label class="form-label">Confirm password</label>
          <input
            class="form-input"
            [(ngModel)]="passwordConfirm"
            placeholder="Confirm password"
            type="password"
          />
        </div>

        @if (passwordMismatch()) {
          <p class="error-msg">Passwords do not match.</p>
        }

        @if (error()) {
          <p class="error-msg">{{ error() }}</p>
        }

        <button class="btn btn-primary" (click)="submit()">Create account</button>

        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">or</span>
          <span class="divider-line"></span>
        </div>

        <button class="btn btn-social" (click)="auth.loginOrRegisterWithGoogle()">
          <img class="social-icon" src="public/google.ico" alt="Google" />
          Sign up with Google
        </button>

        <div class="auth-footer">
          <span class="footer-text">Already have an account?</span>
          <a class="footer-link" routerLink="/login">Log in</a>
        </div>
      </div>
    </div>
  `,
  styleUrl: './register.scss',
})
export class Register {
  protected auth = inject(Auth);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  username = '';
  email = '';
  password = '';
  passwordConfirm = '';
  error = signal<string | null>(null);
  passwordMismatch = signal(false);

  submit(): void {
    this.error.set(null);
    this.passwordMismatch.set(false);

    if (this.password !== this.passwordConfirm) {
      this.passwordMismatch.set(true);
      return;
    }

    this.http
      .post(`${environment.apiUrl}/auth/register`, {
        username: this.username,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => void this.router.navigate(['/login']),
        error: () => this.error.set('Registration failed. Please try again.'),
      });
  }
}
