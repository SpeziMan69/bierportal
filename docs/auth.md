# Authentication & Authorization

How login, sessions and access control work in Bierportal. See [`API.md`](API.md) for the endpoint reference and [`er-modell.md`](er-modell.md) for the `User` entity shape.

## Overview

- Two ways to sign in: **local email/username + password**, and **Google OAuth2**. Both end up issuing the same kind of JWT.
- The JWT is delivered as an **httpOnly cookie** (`token`), never returned in a JSON body and never stored in `localStorage`/`sessionStorage`.
- There is **no refresh-token flow** — a session simply expires when the token does, and the user logs in again.
- There is **no role/permission system** — every authenticated user has the same privileges. Access to *your own* resources (reviews, beer-list entries, profile) is enforced by ownership checks in the service layer, not by roles.

## Registration (local)

`POST /auth/register`, rate-limited to 3 requests/60s.

1. `auth.service.ts` checks that both the username and email are still free.
2. The password is hashed with **bcrypt (cost factor 12)** and stored as `passwordHash`.
3. A `User` row is created with `passwordHash` set and `googleId` left `null`.

## Login (local)

`POST /auth/login`, rate-limited to 5 requests/60s.

1. The user is looked up by email (if the identifier contains `@`) or by username.
2. `bcrypt.compare()` checks the password against `passwordHash`. A user created via Google-only sign-up has `passwordHash: null` and this comparison is guarded against — that user can't log in with a password until they set one.
3. On success, a JWT is signed with payload `{ sub, email, username, isUsernameSet }` and set as the `token` cookie (`httpOnly`, `secure` in production, `sameSite: 'strict'`).
4. The response body only contains `{ id, email }` — the token itself never leaves the cookie.

## Google OAuth

1. `GET /auth/google` redirects to Google (Passport `GoogleStrategy`, scope `email profile`).
2. `GET /auth/google/callback` runs `GoogleStrategy.validate()`, which calls `authService.findOrCreateGoogleUser()`:
   - **Existing Google user** (matching `googleId`) → log them in as-is.
   - **Verified email matches an existing local account** → link the Google account to it (`googleId` is added to that user).
   - **Otherwise** → create a new user with a random placeholder username (`user_<uuid>`) and `isUsernameSet: false`.
3. A JWT is issued the same way as local login and set as the `token` cookie.
4. The callback redirects to `FRONTEND_URL/dashboard` if `isUsernameSet` is `true`, otherwise to `FRONTEND_URL/choose-username` so first-time Google users pick a real username via `PATCH /auth/set-username`.

## Reading the token on the backend

- `JwtStrategy` (Passport) extracts the JWT from the `token` cookie (not an `Authorization` header) and verifies it with `JWT_SECRET`.
- `JwtAuthGuard` — standard guard, rejects with `401` if the cookie is missing/invalid/expired.
- `OptionalJwtAuthGuard` — same extraction, but never rejects; used on endpoints that behave differently for logged-in vs anonymous users (e.g. `GET /reviews/beer/:beerId` adds a `likedByMe` flag only when authenticated).

## Logout & account deletion

- `POST /auth/logout` simply clears the `token` cookie. The JWT itself is **stateless and not revoked server-side** — if a token were copied out of the cookie before logout, it would remain valid until it naturally expires.
- `DELETE /auth/account` deletes the user row and clears the cookie.

## Frontend integration

- `core/auth/auth.ts` — signal-based `Auth` service (`user` signal), wraps `login`, `register`, `logout`, `setUsername`, `deleteAccount`, and `loginOrRegisterWithGoogle()` (a full-page redirect to `/auth/google`, since OAuth can't happen inside an XHR).
- `initAuth()` runs once at bootstrap (`provideAppInitializer` in `app.config.ts`) and calls `GET /auth/profile` to populate the `user` signal from the existing cookie, so route guards have the right state before the app renders.
- `core/interceptors/credentials-interceptor.ts` adds `withCredentials: true` to every HTTP request so the browser sends the cookie — the frontend never reads or attaches the JWT itself.
- Route guards (`core/guards/`) are plain signal checks, no HTTP calls: `auth.guard.ts` (must be logged in), `guest.guard.ts` (must be logged out, for `/login` and `/register`), `username.guard.ts` (blocks `/choose-username` once a username is already set).

## Known limitations

These are worth knowing if you extend auth, not necessarily bugs to fix immediately:

- No refresh tokens — sessions end abruptly at expiry with no silent renewal.
- No server-side token revocation/blacklist — logout only clears the client cookie.
- No roles/admin distinction — anyone logged in can create/edit beers and breweries.
- The auth cookie's `maxAge` is currently independent of the `JWT_EXPIRATION` env var — if you change `JWT_EXPIRATION`, double check the cookie lifetime in `auth.controller.ts` still matches, or the cookie could outlive (or expire before) the token it holds.
