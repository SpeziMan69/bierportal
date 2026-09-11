import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  protected auth = inject(Auth);
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

    this.auth.register(this.username, this.email, this.password).subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => this.error.set('Registration failed. Please try again.'),
    });
  }
}
