import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Register } from './features/register/register';
import { ChooseUsername } from './features/choose-username/choose-username';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { usernameGuard } from './core/guards/username.guard';
import { Home } from './pages/home/home';
import { BeerList } from './pages/beer-list/beer-list';
import { BeerDetail } from './pages/beer-detail/beer-detail';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'beers', component: BeerList },
  { path: 'beers/:id', component: BeerDetail },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'choose-username', component: ChooseUsername, canActivate: [authGuard, usernameGuard] },
  { path: '**', redirectTo: '' },
];
