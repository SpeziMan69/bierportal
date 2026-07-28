# Backend - NestJS API

REST API built with NestJS, TypeORM, and PostgreSQL.

## 🏗️ Structure

```
src/
├── app.module.ts           # Root module
├── main.ts                 # Application entry point
├── common/                 # Shared DTOs, entities, filters
│   ├── dto/
│   ├── entities/
│   └── filters/
├── config/                 # Configuration files
├── database/               # Database setup
│   ├── migration/          # TypeORM migrations
│   └── seeds/              # Database seeds
└── modules/                # Feature modules
```

## 🚀 Development

**Note:** This is an NX monorepo app. Run all commands from the **project root**.

### Start Development Server

```bash
# From project root
npm run backend:start:dev
```

The API will be available at `http://localhost:3000`

### Build for Production

```bash
npm run backend:build
```

### Run Production Build

```bash
npm run backend:start
```

## 🧪 Testing

```bash
# Unit tests
npm run backend:test

# E2E tests
npm run backend:test:e2e

# Watch mode
nx test backend --watch
```

## 🔍 Code Quality

```bash
# Lint
npm run backend:lint

# Format
npm run backend:format
```

## 📝 Code Conventions

- Kein `any` – immer Interfaces nutzen
- Explizite Return Types bei Funktionen
- Services → `core/services/`
- Wiederverwendbare Components → `shared/components/`
- Feature-spezifisches → `features/[name]/`

## 🗄️ Database

PostgreSQL 16 database configured with TypeORM.

### Run Migrations

```bash
# Generate migration
nx run backend:migration:generate --name=MigrationName

# Run migrations
nx run backend:migration:run

# Revert last migration
nx run backend:migration:revert
```

### Environment Variables

Configure in `.env` at project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
```

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [NX Documentation](https://nx.dev)
