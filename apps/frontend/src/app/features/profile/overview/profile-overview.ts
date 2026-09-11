import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MediaUrlPipe } from '../../../shared/pipes/media-url.pipe';
import { UserService } from '../../../services/user';
import type { UpdatedProfile, UserProfile } from '../../../models/user';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB, mirrors the backend upload limit

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
  protected readonly picture = signal('');
  protected readonly imageError = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly success = signal(false);

  constructor() {
    effect(() => {
      const p = this.profile();
      this.username = p.username;
      this.picture.set(p.picture ?? '');
      this.imageError.set(false);
    });
  }

  protected save(): void {
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);

    this.userService.updateMe({ username: this.username.trim() }).subscribe({
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

  protected onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      input.value = '';
      this.error.set('Das Bild darf höchstens 5 MB groß sein.');
      this.success.set(false);
      return;
    }

    this.uploading.set(true);
    this.error.set(null);
    this.success.set(false);

    this.userService.uploadAvatar(file).subscribe({
      next: (result) => {
        this.uploading.set(false);
        this.success.set(true);
        this.imageError.set(false);
        this.picture.set(result.picture ?? '');
        this.updated.emit(result);
        input.value = '';
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        this.uploading.set(false);
        input.value = '';
        const message = err?.error?.message;
        this.error.set(
          Array.isArray(message)
            ? message.join(' ')
            : (message ?? 'Der Upload ist fehlgeschlagen.'),
        );
      },
    });
  }
}
