# Architecture Overview

High-level map of how Bierportal is put together. For details, see [`API.md`](API.md) (endpoints), [`er-modell.md`](er-modell.md) (database), and [`auth.md`](auth.md) (auth flow).

## Stack

- **Frontend:** Angular 21 (standalone components, signals), Tailwind CSS
- **Backend:** NestJS 11, TypeORM
- **Database:** PostgreSQL 16
- **Monorepo tooling:** NX

## Monorepo layout

```
apps/
├── backend/          # NestJS REST API
├── frontend/         # Angular SPA
└── shared/dtos/       # DTOs shared by both (imported as @bierportal/dtos)
```

Frontend and backend only talk to each other over REST/JSON. The frontend calls `API_URL` (`http://localhost:3000` in dev); the backend restricts cross-origin requests to `CORS_ORIGIN` and enables `credentials: true`, which is required because auth uses a cookie rather than a bearer token (see [`auth.md`](auth.md)).

## Backend (`apps/backend/src/`)

### Modules (`modules/`)

| Module | Responsibility |
|---|---|
| `auth` | Registration/login (local + Google OAuth), JWT issuance, logout, account deletion — see [`auth.md`](auth.md) |
| `users` | Own-profile updates, public profile lookup, a user's reviews/likes |
| `beers` | Beer catalog: CRUD, paginated/filterable listing, image upload, soft-delete (`isActive`) |
| `breweries` | Brewery CRUD, paginated/filterable listing, logo upload, blocked hard-delete while beers still reference it |
| `reviews` | One review per user/beer, CRUD on your own review, like/unlike, public listing with optional auth |
| `user-beers` | Personal beer-tracking list (`tried` / `wishlist` / `cellar`), fully auth-gated |

### Cross-cutting concerns

- **Validation:** global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) validates request bodies against `class-validator` DTOs from `@bierportal/dtos`. Environment variables are validated separately with a Joi schema (`config/validation.schema.ts`) at boot.
- **Security middleware:** `helmet()` and `cookie-parser` are applied globally; `cookie-parser` is required because the JWT lives in a cookie, not a header.
- **Rate limiting:** `@nestjs/throttler`, global default 100 requests/60s, with tighter per-route limits (e.g. login, register) — see [`API.md`](API.md).
- **Errors:** a global `AllExceptionsFilter` normalizes every error into `{ statusCode, message, error, timestamp, path }`.
- **API docs:** Swagger UI is served at `/api`, configured with the same cookie-based auth scheme the API actually uses.

### Database

- TypeORM, PostgreSQL. Entities live in `common/entities/` (`Beer`, `Brewery`, `Review`, `ReviewLike`, `UserBeerEntry`) plus `modules/users/user.entity.ts` (`User`).
- `synchronize` is enabled outside `production` for fast local iteration; migrations (`database/migration/`) are the source of truth in production.
- `database/seeds/seed.ts` seeds sample beer/brewery data (from Open Beer Database / Open Food Facts).
- Full entity relationships and fields are diagrammed in [`er-modell.md`](er-modell.md) — not repeated here.

## Frontend (`apps/frontend/src/app/`)

| Folder | Contains |
|---|---|
| `core/` | `auth/` (session state), `guards/` (route guards), `interceptors/` (attaches credentials to every request) |
| `components/` | Reusable presentational pieces: `beer-card`, `beer-reviews`, `navbar`, `footer` |
| `features/` | Routed feature areas with their own logic: `login`, `register`, `choose-username`, `profile` (with `overview`/`beers`/`reviews`/`likes`/`danger` sub-views) |
| `pages/` | Top-level routed pages: `home`, `beer-list`, `beer-detail`, `breweries` |
| `services/` | API clients (`beer`, `review`, `user`) |
| `shared/pipes/` | e.g. `media-url` pipe to resolve backend-hosted image URLs |

Routing, guards and app-wide providers (HTTP client with the credentials interceptor, the auth bootstrap initializer) are wired in `app.routes.ts` / `app.config.ts`.

## Where to look next

- Adding an endpoint → [`API.md`](API.md) for existing conventions (error shape, rate limits, auth requirements) to stay consistent with.
- Changing the data model → [`er-modell.md`](er-modell.md), then a TypeORM migration (`npm run migration:generate`).
- Touching login/session behavior → [`auth.md`](auth.md), including its "Known limitations" section before assuming a refresh-token or roles system exists.
