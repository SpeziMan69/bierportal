import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BeerList } from './beer-list';

describe('BeerList server search', () => {
  it('loads global options, cancels stale requests and preserves filters when paging', () => {
    TestBed.configureTestingModule({
      imports: [BeerList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BeerList);
    const component = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.ngOnInit();
    http
      .expectOne((req) => req.url.endsWith('/filters'))
      .flush({
        styles: ['Stout'],
        countries: ['Ireland'],
      });
    const initial = http.expectOne((req) => req.url.endsWith('/beers'));
    component['searchChanged']('Guinness');
    expect(initial.cancelled).toBe(true);
    component['selectedType'] = 'Stout';
    component['selectedCountry'] = 'Ireland';
    component['loadInitialBeers']();
    const search = http.expectOne((req) => req.params.get('q') === 'Guinness');
    expect(search.request.params.get('style')).toBe('Stout');
    expect(search.request.params.get('country')).toBe('Ireland');
    search.flush({ items: [], page: 1, totalPages: 2, total: 25 });
    expect(component['beerTypes']()).toEqual(['Stout']);
    component['loadMoreBeers']();
    const more = http.expectOne((req) => req.params.get('page') === '2');
    expect(more.request.params.get('q')).toBe('Guinness');
    component['resetFilters']();
    expect(more.cancelled).toBe(true);
    const reset = http.expectOne((req) => req.params.get('page') === '1');
    expect(reset.request.params.has('q')).toBe(false);
    expect(reset.request.params.has('style')).toBe(false);
    reset.flush({ items: [], page: 1, totalPages: 0, total: 0 });
    fixture.destroy();
    http.verify();
  });
});
