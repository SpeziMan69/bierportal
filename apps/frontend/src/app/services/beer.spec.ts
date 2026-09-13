import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { BeerService, type BeerFilterOptions, type BeerPage } from './beer';
import { environment } from '../../environments/environment';
import type { Beer } from '../models/beer';

describe('BeerService', () => {
  let service: BeerService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/beers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BeerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('GET /beers with default paging and no filters', () => {
    const mockResponse: BeerPage = { items: [], page: 1, limit: 24, total: 0, totalPages: 0 };

    service.getBeers().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(
      (r) => r.url === apiUrl && r.params.get('page') === '1' && r.params.get('limit') === '24',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.params.has('q')).toBe(false);
    req.flush(mockResponse);
  });

  it('only sends trimmed, non-empty filter values as query params', () => {
    service
      .getBeers(2, 10, { q: '  pale  ', style: '', country: undefined, sort: 'rating-desc' })
      .subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === apiUrl && r.params.get('page') === '2' && r.params.get('limit') === '10',
    );
    expect(req.request.params.get('q')).toBe('pale');
    expect(req.request.params.has('style')).toBe(false);
    expect(req.request.params.has('country')).toBe(false);
    expect(req.request.params.get('sort')).toBe('rating-desc');
    req.flush({ items: [], page: 2, limit: 10, total: 0, totalPages: 0 });
  });

  it('GET /beers/filters', () => {
    const mockResponse: BeerFilterOptions = { styles: ['IPA'], countries: ['DE'] };

    service.getFilterOptions().subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/filters`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('GET /beers/:id url-encodes the id', () => {
    const mockBeer: Beer = {
      id: 'abc def',
      name: 'Test Beer',
      brewery: 'Test Brewery',
      country: 'DE',
      type: 'Lager',
      alcohol: 5,
      rating: 4.2,
      imageUrl: '/uploads/beers/test.png',
      description: '',
    };

    service.getBeerById('abc def').subscribe((res) => {
      expect(res).toEqual(mockBeer);
    });

    const req = httpMock.expectOne(`${apiUrl}/${encodeURIComponent('abc def')}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBeer);
  });
});
