Fully Ai

# Backend API Reference

Base URL: `http://localhost:3000`

Interactive Swagger UI is available at `/api`.

## Conventions

- **Auth**: Protected endpoints require a valid JWT delivered via the httpOnly `token` cookie (set by `POST /auth/login` or the Google OAuth callback). Requests without a valid cookie receive `401 Unauthorized`.
- **Validation**: Request bodies are validated with a global `ValidationPipe` (`whitelist` + `forbidNonWhitelisted` + `transform`). Unknown or invalid fields yield `400 Bad Request`.
- **Errors**: A global `AllExceptionsFilter` returns a consistent JSON shape:
  ```json
  {
    "statusCode": 404,
    "message": "…",
    "error": "Not Found",
    "timestamp": "2026-09-09T08:23:23.480Z",
    "path": "/breweries/…"
  }
  ```
  `message` may be a string or an array of validation messages.
- **Rate limiting**: Global default is 100 requests / 60 s. Tighter per-route limits are noted below.
- **IDs**: All resource IDs are UUID v4. Malformed IDs return `404`.

---

## App

### `GET /`
Liveness greeting.

- **Auth**: none
- **Returns** `200`: `"Hello World!"` (plain text)

### `GET /health`
Service and database connectivity status.

- **Auth**: none
- **Returns** `200`:
  ```json
  {
    "status": "ok",
    "database": { "connected": true, "type": "postgres", "database": "…" },
    "timestamp": "2026-09-09T08:00:00.000Z"
  }
  ```
  On DB failure, `status` is `"error"` and `database` includes an `error` message.

---

## Auth (`/auth`)

### `POST /auth/register`
Create a new local account.

- **Auth**: none · **Rate limit**: 3 / 60 s
- **Body**:
  | Field | Type | Rules |
  |-------|------|-------|
  | `username` | string | required, min 4 chars, no space/comma/slash/backslash/`!` |
  | `email` | string | required, valid email |
  | `password` | string | required, min 8, must contain upper + lower + digit/special |
- **Returns** `201`: `{ "id": "uuid", "email": "user@example.com" }`
- **Errors**: `400` validation, `409` if username/email already taken.

### `POST /auth/login`
Log in with email or username + password.

- **Auth**: none · **Rate limit**: 5 / 60 s
- **Body**:
  | Field | Type | Rules |
  |-------|------|-------|
  | `identifier` | string | required (email or username) |
  | `password` | string | required, min 8 |
- **Returns** `200`: `{ "id": "uuid", "email": "user@example.com" }` and sets an httpOnly `token` cookie (15 min).
- **Errors**: `400` validation, `401` invalid credentials.

### `GET /auth/profile`
Return the user decoded from the JWT cookie.

- **Auth**: required
- **Returns** `200`: `{ "id", "email", "username", "isUsernameSet" }`

### `PATCH /auth/set-username`
Set the username after Google sign-up.

- **Auth**: required
- **Body**: `{ "username": "string" }`
- **Returns** `200`: updated user info.

### `POST /auth/logout`
Clear the session cookie.

- **Auth**: none (clears cookie if present)
- **Returns** `200`: `{ "message": "Logout erfolgreich" }`

### `GET /auth/google`
Start Google OAuth login (redirects to Google).

- **Auth**: none
- **Returns**: `302` redirect to Google.

### `GET /auth/google/callback`
Google OAuth callback. Sets the session cookie and redirects to the frontend (`/dashboard` or `/choose-username`).

- **Auth**: none (handled by Passport)
- **Returns**: `302` redirect.

### `DELETE /auth/account`
Permanently delete the authenticated account (cascades to reviews, likes, beer entries) and clear the cookie.

- **Auth**: required
- **Returns** `200`: `{ "message": "Account deleted" }`

---

## Users (`/users`)

### `PATCH /users/me`
Update your own profile.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Body** (all optional):
  | Field | Type | Rules |
  |-------|------|-------|
  | `username` | string | 3–30 chars, letters/numbers/underscore only |
  | `picture` | string | valid URL, max 2048 chars |
- **Returns** `200`: `{ "id", "username", "picture", "createdAt" }`
- **Errors**: `400` validation, `401` no auth, `409` username already taken.

### `GET /users/:id`
Public profile plus review and like counts.

- **Auth**: none
- **Path**: `id` — user UUID
- **Returns** `200`: `{ "id", "username", "picture", "createdAt", "reviewCount", "likeCount" }`
- **Errors**: `404` unknown/invalid id.

### `GET /users/:id/reviews`
A user's published reviews, newest first.

- **Auth**: none
- **Path**: `id` — user UUID
- **Returns** `200`: array of `{ "id", "rating", "text", "createdAt", "updatedAt", "beer": { "id", "name" } | null }`

### `GET /users/:id/likes`
Reviews the user has liked, newest first.

- **Auth**: none
- **Path**: `id` — user UUID
- **Returns** `200`: array of `{ "id", "createdAt", "review": { "id", "rating", "text", "beer": { "id", "name" } | null } | null }`

---

## Beers (`/beers`)

### `GET /beers`
Paginated, filterable list of active beers.

- **Auth**: none
- **Query**:
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | `page` | int | 1 | min 1 |
  | `limit` | int | 24 | clamped to 1–100 |
  | `q` | string | – | case-insensitive search over beer name **or** brewery name |
  | `style` | string | – | case-insensitive partial match on style |
  | `country` | string | – | case-insensitive partial match on brewery country |
  | `sort` | enum | `name-asc` | one of `name-asc`, `rating-desc`, `alcohol-asc`, `alcohol-desc` (ABV sorts put nulls last) |
- **Returns** `200`: `{ "items": BeerResponse[], "page", "limit", "total", "totalPages" }`

`BeerResponse`:
```json
{
  "id": "uuid",
  "name": "…",
  "brewery": "Brewery name or 'Unbekannte Brauerei'",
  "country": "… or 'Unbekannt'",
  "type": "style or 'Bier'",
  "alcohol": 5.2,
  "rating": 4.3,
  "imageUrl": "/uploads/beers/… or /public/beer-placeholder.png",
  "description": "…"
}
```
`alcohol` and `rating` may be `null`.

### `GET /beers/:id`
Get a single active beer.

- **Auth**: none
- **Path**: `id` — beer UUID
- **Returns** `200`: `BeerResponse`
- **Errors**: `404` unknown/invalid id.

### `POST /beers`
Create a beer.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Body**:
  | Field | Type | Rules |
  |-------|------|-------|
  | `name` | string | required, max 200 |
  | `description` | string | optional, max 5000 |
  | `abv` | number | optional, 0–100 |
  | `ibu` | number | optional, ≥ 0 |
  | `ebc` | number | optional, ≥ 0 |
  | `imageUrl` | string | optional, max 2048 |
  | `style` | string | optional, max 100 |
  | `breweryId` | string | optional, UUID |
- **Returns** `201`: `BeerResponse`
- **Errors**: `400` validation, `401` no auth, `404` unknown `breweryId`.

### `PATCH /beers/:id`
Update a beer (partial — all `POST /beers` fields, optional).

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Path**: `id` — beer UUID
- **Body**: any subset of the create fields.
- **Returns** `200`: `BeerResponse`
- **Errors**: `400`, `401`, `404`.

### `DELETE /beers/:id`
Soft-delete a beer (marks it inactive).

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Path**: `id` — beer UUID
- **Returns** `204`: no content
- **Errors**: `401`, `404`.

### `POST /beers/:id/image`
Upload/replace a beer image.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Content-Type**: `multipart/form-data`, field `image` (file)
- **Path**: `id` — beer UUID
- **Returns** `201`: `BeerResponse` (with new `imageUrl`)
- **Errors**: `400` missing file, `401`, `404`.

---

## Breweries (`/breweries`)

### `GET /breweries`
Paginated, filterable list of breweries (ordered by name).

- **Auth**: none
- **Query**:
  | Param | Type | Default | Notes |
  |-------|------|---------|-------|
  | `page` | int | 1 | |
  | `limit` | int | 24 | clamped to 1–100 |
  | `q` | string | – | case-insensitive search over brewery name **or** city |
  | `city` | string | – | case-insensitive partial match on city |
  | `country` | string | – | case-insensitive partial match on country |
- **Returns** `200`: `{ "items": Brewery[], "total", "page", "limit", "totalPages" }`

`Brewery`:
```json
{
  "id": "uuid",
  "sourceId": null,
  "externalId": null,
  "name": "…",
  "city": null,
  "state": null,
  "country": null,
  "region": null,
  "website": null,
  "description": null,
  "logoUrl": null,
  "createdAt": "…"
}
```

### `GET /breweries/:id`
Get a single brewery.

- **Auth**: none
- **Path**: `id` — brewery UUID
- **Returns** `200`: `Brewery`
- **Errors**: `404` unknown/invalid id.

### `POST /breweries`
Create a brewery.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Body**:
  | Field | Type | Rules |
  |-------|------|-------|
  | `name` | string | required, max 200 |
  | `city` | string | optional, max 120 |
  | `state` | string | optional, max 120 |
  | `country` | string | optional, max 120 |
  | `region` | string | optional, max 120 |
  | `website` | string | optional, valid URL, max 2048 |
  | `description` | string | optional, max 5000 |
  | `logoUrl` | string | optional, max 2048 |
- **Returns** `201`: `Brewery`
- **Errors**: `400`, `401`.

### `PATCH /breweries/:id`
Update a brewery (partial — all create fields, optional).

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Path**: `id` — brewery UUID
- **Returns** `200`: `Brewery`
- **Errors**: `400`, `401`, `404`.

### `DELETE /breweries/:id`
Delete a brewery.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Path**: `id` — brewery UUID
- **Returns** `204`: no content
- **Errors**: `401`, `404`, `409` if beers still reference this brewery.

### `POST /breweries/:id/logo`
Upload/replace a brewery logo.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Content-Type**: `multipart/form-data`, field `logo` (file)
- **Path**: `id` — brewery UUID
- **Returns** `201`: `Brewery` (with new `logoUrl`)
- **Errors**: `400` missing file, `401`, `404`.

---

## Reviews (`/reviews`)

`Review` response shape:
```json
{
  "id": "uuid",
  "rating": 4.5,
  "text": "…",
  "isDraft": false,
  "createdAt": "…",
  "updatedAt": "…",
  "likeCount": 3,
  "user": { "id", "username", "picture" } | null,
  "beer": { "id", "name" } | null
}
```

### `GET /reviews/beer/:beerId`
All published (non-draft) reviews for a beer, newest first, with like counts.

- **Auth**: none
- **Path**: `beerId` — beer UUID
- **Returns** `200`: array of `Review`
- **Errors**: `404` unknown beer.

### `POST /reviews`
Create a review (one per user per beer).

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Body**:
  | Field | Type | Rules |
  |-------|------|-------|
  | `beerId` | string | required, UUID |
  | `rating` | number | required, 0.5–5, max 1 decimal |
  | `text` | string | optional, max 2000 |
  | `isDraft` | boolean | optional (default `false`) |
- **Returns** `201`: `Review`
- **Errors**: `400`, `401`, `404` unknown beer, `409` already reviewed this beer.

### `PATCH /reviews/:id`
Update **your own** review (partial).

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Path**: `id` — review UUID
- **Body**: any subset of `rating`, `text`, `isDraft` (`beerId` cannot be changed).
- **Returns** `200`: `Review`
- **Errors**: `400`, `401`, `403` not your review, `404`.

### `DELETE /reviews/:id`
Delete **your own** review.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Path**: `id` — review UUID
- **Returns** `204`: no content
- **Errors**: `401`, `403` not your review, `404`.

### `POST /reviews/:id/like`
Like another user's review.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Path**: `id` — review UUID
- **Returns** `201`: `{ "liked": true, "likeCount": 4 }`
- **Errors**: `401`, `403` cannot like your own review, `404`, `409` already liked.

### `DELETE /reviews/:id/like`
Remove your like from a review.

- **Auth**: required · **Rate limit**: 20 / 60 s
- **Path**: `id` — review UUID
- **Returns** `200`: `{ "liked": false, "likeCount": 3 }`
- **Errors**: `401`, `404` not liked.

---

## User Beers (`/user-beers`)

All endpoints require authentication (controller-level guard). Entries are per-user; you can only access/modify your own. A beer may have one entry per status (e.g. both `cellar` and `tried` at once), each with its own note.

`BeerStatus` enum: `tried` · `wishlist` · `cellar`.

### `GET /user-beers`
List your beer entries, optionally filtered by status.

- **Auth**: required
- **Query**: `status` (optional) — one of `tried`, `wishlist`, `cellar`
- **Returns** `200`: array of your beer entries
- **Errors**: `404` unknown status value.

### `POST /user-beers`
Add or update a beer entry (upsert per status — updates the note if an entry with the same beer **and** status already exists, otherwise creates a new one).

- **Auth**: required
- **Body**:
  | Field | Type | Rules |
  |-------|------|-------|
  | `beerId` | string | required, UUID |
  | `status` | enum | required (`tried`/`wishlist`/`cellar`) |
  | `note` | string | optional |
- **Returns** `201`: the created/updated entry
- **Errors**: `400`, `401`, `404` unknown beer.

### `PATCH /user-beers/:id`
Update the status/note of one of your entries.

- **Auth**: required
- **Path**: `id` — entry UUID
- **Body** (both optional): `status` (enum), `note` (string)
- **Returns** `200`: the updated entry
- **Errors**: `400`, `401`, `403` not your entry, `404`.

### `DELETE /user-beers/:id`
Remove one of your beer entries.

- **Auth**: required
- **Path**: `id` — entry UUID
- **Returns** `204`: no content
- **Errors**: `401`, `403` not your entry, `404`.
