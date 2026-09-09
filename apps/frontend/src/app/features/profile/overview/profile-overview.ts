import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaUrlPipe } from '../../../shared/pipes/media-url.pipe';
import { UserService } from '../../../services/user';
import type { UpdatedProfile, UserProfile } from '../../../models/user';

@Component({
  selector: 'app-profile-overview',
  standalone: true,
  imports: [FormsModule, MediaUrlPipe],
  templateUrl: './profile-overview.html',
  styleUrl: './profile-overview.scss',
})
export class ProfileOverview {
  private readonly userService = inject(UserService);

  readonly profile = input.required<UserProfile>();
  readonly updated = output<UpdatedProfile>();

  protected username = '';
  protected picture = '';
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);

  constructor() {
    effect(() => {
      const p = this.profile();
      this.username = p.username;
      this.picture = p.picture ?? '';
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);

    const trimmedPicture = this.picture.trim();
    this.userService
      .updateMe({
        username: this.username.trim(),
        picture: trimmedPicture === '' ? undefined : trimmedPicture,
      })
      .subscribe({
        next: (result) => {
          this.saving.set(false);
          this.success.set(true);
          this.updated.emit(result);
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          this.saving.set(false);
          const message = err?.error?.message;
          this.error.set(
            Array.isArray(message)
              ? message.join(' ')
              : (message ?? 'Dein Profil konnte nicht gespeichert werden.'),
          );
        },
      });
  }
}
