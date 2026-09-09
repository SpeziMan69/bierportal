import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth/auth';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  protected readonly auth = inject(Auth);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.auth.user.set(null);
        void this.router.navigate(['/']);
      },
    });
  }
}
