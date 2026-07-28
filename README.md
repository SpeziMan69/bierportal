```markdown
# WebEng-Projekt

## 📁 Project Structure

```
/
├── apps/
│   ├── backend/         # NestJS Backend
│   └── frontend/        # Angular Frontend
├── docker/              # Docker configurations
├── docs/                # Project documentation
├── .env.example         # Environment variables template
├── nx.json              # NX workspace configuration
├── package.json         # Dependencies & scripts
└── tsconfig.base.json   # Shared TypeScript config
```

## 🚀 Tech Stack

- **Frontend:** Angular 17+ (Standalone Components), TypeScript, SCSS
- **Backend:** NestJS, TypeScript, TypeORM
- **Database:** PostgreSQL 16
- **Build System:** NX Monorepo
- **Infrastructure:** Docker

## ⚙️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start database:**
   ```bash
   npm run docker:up
   ```

4. **Start backend:**
   ```bash
   npm run backend:start:dev
   ```

5. **Start frontend:**
   ```bash
   npm run frontend:start
   ```

6. **Open browser:** http://localhost:4200

## 📜 Available Scripts

### Docker
- `npm run docker:up` - Start database
- `npm run docker:down` - Stop database
- `npm run docker:logs` - View database logs

### Backend
- `npm run backend:start` - Run production build
- `npm run backend:start:dev` - Run development mode
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
- `npm run format` - Format all code

## 🏗️ Development

### Code Conventions
- Angular 17+ Standalone Components
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

## Features
- [ ] Feature 1
- [ ] Feature 2
```