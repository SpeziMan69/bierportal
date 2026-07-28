import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  protected auth = inject(Auth);
  private readonly router = inject(Router);
  identifier = '';
  password = '';
  error = signal<string | null>(null);

  submit(): void {
    this.error.set(null);
    this.auth.login(this.identifier, this.password).subscribe({
      next: (res) => this.auth.user.set(res),
      error: () => this.error.set('Login fehlgeschlagen'),
    });
  }
}
