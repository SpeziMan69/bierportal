# Frontend - Angular Application

Modern Angular 17+ application with standalone components, signals, and TypeScript.

## 🏗️ Structure

```
src/
├── app/
│   ├── app.ts              # Root component
│   ├── app.routes.ts       # Routing configuration
│   ├── app.config.ts       # Application config
│   ├── core/               # Core services, guards, interceptors
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   └── services/
│   ├── features/           # Feature modules
│   ├── layout/             # Layout components
│   │   ├── header/
│   │   └── sidebar/
│   └── shared/             # Shared components, directives, pipes
│       ├── components/
│       ├── directives/
│       └── pipes/
├── environments/           # Environment configurations
└── styles.scss             # Global styles
```

## 🚀 Development

**Note:** This is an NX monorepo app. Run all commands from the **project root**.

### Start Development Server

```bash
# From project root
npm run frontend:start
```

Open your browser to `http://localhost:4200/`

### Build for Production

```bash
npm run frontend:build
```

Build artifacts will be in `dist/apps/frontend/`

## 🧪 Testing

```bash
# Unit tests
npm run frontend:test

# Watch mode
nx test frontend --watch
```

## 🔍 Code Quality

```bash
# Lint
npm run frontend:lint

# Format
npm run frontend:format
```

## 📝 Code Conventions

### Angular 17+ Best Practices

- **Standalone Components** - No NgModules
- **inject()** instead of constructor injection
- **async pipe** instead of manual subscriptions
- **Signals** for local state management
- **OnPush** Change Detection strategy

### TypeScript

- Kein `any` – immer Interfaces nutzen
- Explizite Return Types bei Funktionen
- Type-safe everything

### File Naming

- Components: `example-list.component.ts`
- Services: `example.service.ts`
- Interfaces: `example.model.ts`

### Code Organization

- Services → `core/services/`
- Reusable components → `shared/components/`
- Feature-specific → `features/[name]/`

## 🛠️ Generating Code

```bash
# Generate component
nx generate @nx/angular:component --name=my-component --project=frontend

# Generate service
nx generate @nx/angular:service --name=my-service --project=frontend

# Generate guard
nx generate @nx/angular:guard --name=my-guard --project=frontend
```

## 📚 Resources

- [Angular Documentation](https://angular.dev)
- [Angular Signals](https://angular.dev/guide/signals)
- [NX Angular](https://nx.dev/nx-api/angular)
