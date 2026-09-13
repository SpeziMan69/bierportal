import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { usernameGuard } from './username.guard';
import { Auth } from '../auth/auth';

describe('usernameGuard', () => {
  let auth: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    auth = TestBed.inject(Auth);
    TestBed.inject(Router);
  });

  function run(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      usernameGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    ) as boolean | UrlTree;
  }

  it('allows navigation when the user still needs to pick a username', () => {
    auth.user.set({ id: '1', email: 'a@b.com', username: '', isUsernameSet: false });
    expect(run()).toBe(true);
  });

  it('allows navigation when there is no user at all', () => {
    auth.user.set(null);
    expect(run()).toBe(true);
  });

  it('redirects to / once the username is already set', () => {
    auth.user.set({ id: '1', email: 'a@b.com', username: 'a', isUsernameSet: true });
    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/');
  });
});
