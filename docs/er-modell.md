# Entity-Relationship-Modell

Datenmodell des Bierportals (TypeORM-Entities, PostgreSQL). Die IDs sind UUIDs,
Zeitstempel werden von TypeORM (`@CreateDateColumn` / `@UpdateDateColumn`) gesetzt.

## Diagramm

```mermaid
erDiagram
    USER ||--o{ REVIEW : "schreibt"
    USER ||--o{ REVIEW_LIKE : "vergibt"
    USER ||--o{ USER_BEER_ENTRY : "merkt/bewertet"
    BREWERY ||--o{ BEER : "braut"
    BEER ||--o{ REVIEW : "hat"
    BEER ||--o{ USER_BEER_ENTRY : "gelistet in"
    REVIEW ||--o{ REVIEW_LIKE : "erhält"

    USER {
        uuid id PK
        varchar username UK
        varchar email UK
        varchar passwordHash "nullable"
        varchar googleId UK "nullable"
        varchar picture "nullable"
        bool isUsernameSet
        timestamptz createdAt
    }

    BREWERY {
        uuid id PK
        int sourceId UK "nullable, Import-Key"
        varchar externalId UK "nullable, OFF-Key"
        varchar name
        varchar city "nullable"
        varchar state "nullable"
        varchar country "nullable"
        varchar region "nullable"
        varchar website "nullable"
        text description "nullable"
        varchar logoUrl "nullable"
        bool isActive "Soft-Delete"
        timestamp createdAt
    }

    BEER {
        uuid id PK
        int sourceId UK "nullable, Import-Key"
        varchar externalId UK "nullable, OFF-Key"
        varchar name
        varchar imageUrl "nullable"
        text description "nullable"
        decimal abv "nullable"
        varchar style "nullable"
        bool isActive
        decimal avgRating "denormalisiert"
        int ratingCount "denormalisiert"
        uuid breweryId FK "nullable"
        timestamp createdAt
    }

    REVIEW {
        uuid id PK
        decimal rating
        text text "nullable"
        bool isDraft
        uuid userId FK
        uuid beerId FK
        timestamp createdAt
        timestamp updatedAt
    }

    REVIEW_LIKE {
        uuid id PK
        uuid userId FK
        uuid reviewId FK
        timestamp createdAt
    }

    USER_BEER_ENTRY {
        uuid id PK
        enum status "tried | wishlist | cellar"
        varchar note "nullable"
        uuid userId FK
        uuid beerId FK
        timestamp addedAt
    }
```

## Beziehungen

| Von | Nach | Kardinalität | Löschverhalten | Besonderheit |
|-----|------|--------------|----------------|--------------|
| `Brewery` | `Beer` | 1 : n | – | `beer.brewery` ist `nullable` (verwaiste Import-Biere bleiben erhalten) |
| `User` | `Review` | 1 : n | `ON DELETE CASCADE` | `UNIQUE(user, beer)` – ein Review pro Nutzer & Bier |
| `Beer` | `Review` | 1 : n | – | |
| `User` | `ReviewLike` | 1 : n | `ON DELETE CASCADE` | `UNIQUE(user, review)` – ein Like pro Nutzer & Review |
| `Review` | `ReviewLike` | 1 : n | `ON DELETE CASCADE` | |
| `User` | `UserBeerEntry` | 1 : n | `ON DELETE CASCADE` | `UNIQUE(user, beer, status)` |
| `Beer` | `UserBeerEntry` | 1 : n | – | |

## Hinweise

- **`avgRating` / `ratingCount`** an `Beer` sind bewusst denormalisiert (aus `Review`
  aggregiert), um Listen ohne Join berechnen zu können.
- **`isActive`** an `Beer` und `Brewery` ist ein Soft-Delete-Flag: Datensätze werden
  ausgeblendet statt gelöscht, damit abhängige Reviews/Einträge erhalten bleiben.
- **`sourceId` / `externalId`** sind Upsert-Schlüssel der Seed-Importe (Open Beer
  Database bzw. Open Food Facts) und verhindern Duplikate bei erneutem Seeding.
- Ein `User` kann sich per Passwort **oder** Google anmelden (`passwordHash` bzw.
  `googleId`); mindestens eines der beiden ist gesetzt.
