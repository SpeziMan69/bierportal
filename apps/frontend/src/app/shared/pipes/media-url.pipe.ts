import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

// Backend-uploaded files (e.g. /uploads/beers/...) are stored as paths relative to the
// API origin, not the frontend origin, so they need the API base URL prepended to load.
@Pipe({
  name: 'mediaUrl',
})
export class MediaUrlPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return value ?? '';
    }
    if (/^(https?:)?\/\//i.test(value)) {
      return value;
    }
    if (value.startsWith('/uploads/')) {
      return `${environment.apiUrl}${value}`;
    }
    return value;
  }
}
