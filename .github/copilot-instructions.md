# Projekt-Konventionen

## Angular
- Angular 17+ Standalone Components
- inject() statt Constructor Injection
- async pipe statt manuell subscribe
- Signals für lokalen State
- OnPush Change Detection

## TypeScript
- Kein any – immer Interfaces nutzen
- Explizite Return Types bei Funktionen

## Struktur
- Services → core/services/
- Wiederverwendbare Components → shared/components/
- Feature-spezifisches → features/[name]/

## Naming
- Components: example-list.component.ts
- Services: example.service.ts
- Interfaces: example.model.ts