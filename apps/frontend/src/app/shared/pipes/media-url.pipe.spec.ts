import { environment } from '../../../environments/environment';
import { MediaUrlPipe } from './media-url.pipe';

describe('MediaUrlPipe', () => {
  let pipe: MediaUrlPipe;

  beforeEach(() => {
    pipe = new MediaUrlPipe();
  });

  it('returns an empty string for null/undefined/empty input', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('prepends the API base URL to backend-relative upload paths', () => {
    expect(pipe.transform('/uploads/beers/foo.png')).toBe(
      `${environment.apiUrl}/uploads/beers/foo.png`,
    );
  });

  it('leaves absolute http(s) URLs untouched', () => {
    expect(pipe.transform('https://example.com/logo.png')).toBe('https://example.com/logo.png');
    expect(pipe.transform('http://example.com/logo.png')).toBe('http://example.com/logo.png');
  });

  it('leaves protocol-relative URLs untouched', () => {
    expect(pipe.transform('//example.com/logo.png')).toBe('//example.com/logo.png');
  });

  it('returns any other value unchanged', () => {
    expect(pipe.transform('assets/placeholder.png')).toBe('assets/placeholder.png');
  });
});
