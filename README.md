# Bierportal (WebEng-Projekt)

A full-stack beer rating/portal app built with Angular and NestJS in an NX monorepo.

## Project Structure

```
/
├── apps/
│   ├── backend/         # NestJS Backend
│   └── frontend/        # Angular Frontend
├── docker/              # Docker configurations (PostgreSQL)
├── docs/                # Project documentation (API, ER model, architecture)
├── .env.example         # Environment variables template
├── nx.json              # NX workspace configuration
├── package.json         # Dependencies & scripts
└── tsconfig.base.json   # Shared TypeScript config
```

## Tech Stack

- **Frontend:** Angular 21 (Standalone Components), TypeScript, Tailwind CSS
- **Backend:** NestJS 11, TypeScript, TypeORM
- **Database:** PostgreSQL 16
- **Build System:** NX Monorepo
- **Infrastructure:** Docker / Docker Compose

## Prerequisites

- **Node.js 20+** and npm (see `.github/workflows/ci.yml` for the version CI runs on)
- **Docker** and **Docker Compose** (for the local PostgreSQL database)
- A Google OAuth Client (only needed if you want to test Google login locally — see [Environment Variables](#environment-variables))

## Getting Started (Fresh Clone / New Repo)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd bierportal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` — at minimum set `DB_USER`, `DB_PASS`, `DB_NAME` and `JWT_SECRET`. See [Environment Variables](#environment-variables) below for what each value does.

4. **Start the database:**
   ```bash
   npm run docker:up
   ```

5. **Run database migrations:**
   ```bash
   npm run migration:run
   ```

6. **(Optional) Seed the database with sample data:**
   ```bash
   npm run backend:seed
   ```

7. **Start the backend:**
   ```bash
   npm run backend:start:dev
   ```

8. **Start the frontend (in a second terminal):**
   ```bash
   npm run frontend:start
   ```

9. **Open the app:**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000
   - Swagger API docs: http://localhost:3000/api

## Environment Variables

Copied from `.env.example`, these are the variables the app expects:

| Variable | Description |
|---|---|
| `DB_HOST` / `DB_PORT` | Database host/port (defaults match the Docker Compose setup) |
| `DB_USER` / `DB_PASS` / `DB_NAME` | PostgreSQL credentials, must match `docker/docker-compose.yml` |
| `NODE_ENV` | `development` / `production` / `test` |
| `CORS_ORIGIN` | Allowed origin for the API (frontend URL) |
| `FRONTEND_URL` | URL the backend uses to build links back to the frontend |
| `API_URL` | Base URL the frontend uses to reach the backend |
| `JWT_SECRET` / `JWT_EXPIRATION` | Signing secret and expiry for auth tokens |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Only required for Google OAuth login |

## Available Scripts

### Docker
- `npm run docker:up` - Start database
- `npm run docker:down` - Stop database
- `npm run docker:logs` - View database logs

### Database
- `npm run migration:generate` - Generate a new TypeORM migration from entity changes
- `npm run migration:run` - Apply pending migrations
- `npm run migration:revert` - Revert the last migration
- `npm run backend:seed` - Seed the database with sample data

### Backend
- `npm run backend:start` - Run production build
- `npm run backend:start:dev` - Build and run in development mode
- `npm run backend:build` - Build for production
- `npm run backend:test` - Run tests
- `npm run backend:lint` - Lint code

### Frontend
- `npm run frontend:start` - Run development server
- `npm run frontend:build` - Build for production
- `npm run frontend:test` - Run tests
- `npm run frontend:lint` - Lint code

### All
- `npm run build` - Build all apps
- `npm run test` - Test all apps
- `npm run lint` - Lint all apps

## CI/CD

GitHub Actions (`.github/workflows/`) run on every push to `main` and every pull request:
- **ci.yml** - lint, typecheck, test and build the projects affected by the change, against a real Postgres service container
- **codeql.yml** / **security.yml** - static security analysis
- **deployment.yml** - deployment pipeline
- **Dependabot** keeps dependencies up to date (`.github/dependabot.yml`)

## Documentation

Further docs live in [`docs/`](docs/README.md):
- [`docs/API.md`](docs/API.md) - REST API endpoints
- [`docs/er-modell.md`](docs/er-modell.md) - Entity-relationship diagram
- [`docs/architektur.md`](docs/architektur.md) - System architecture overview
- [`docs/auth.md`](docs/auth.md) - Authentication & authorization flow

## Development

### Code Conventions
- Angular Standalone Components
- `inject()` instead of constructor injection
- `async` pipe instead of manual subscriptions
- Signals for local state
- OnPush Change Detection
- No `any` types - use interfaces
- Explicit return types

### File Structure
- Services → `core/services/`
- Reusable components → `shared/components/`
- Feature modules → `features/[name]/`

## Troubleshooting

- **`docker:up` fails / backend can't connect to DB** - make sure Docker Desktop is running and `.env` credentials match `docker/docker-compose.yml`.
- **Backend starts but API calls fail with DB errors** - you likely forgot to run `npm run migration:run` after a fresh `docker:up`.
- **Port already in use (3000 or 4200)** - stop whatever else is bound to that port, or change `PORT` / the frontend dev port.

## Features
- [ ] Feature 1
- [ ] Feature 2
