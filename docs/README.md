# Funktionsdokumentation des Bierportals

## 1. Zweck dieser Dokumentation

Diese Datei beschreibt den aktuellen Funktionsumfang des zusammengeführten Bierportal-Projekts. Sie erklärt sowohl das Backend als auch das Frontend, deren Zusammenspiel, die Datenhaltung, die Sicherheitsmechanismen und die lokale Entwicklungsumgebung.

Wichtig: Die Dokumentation unterscheidet bewusst zwischen **bereits implementierten Funktionen**, **vorbereiteten Strukturen** und **noch offenen Punkten**. Das Projekt stellt aktuell vor allem eine technische Grundlage mit vollständigem Registrierungs- und Anmeldebereich bereit. Eigentliche Bierportal-Fachfunktionen wie Bierkatalog, Bewertungen, Favoriten oder Suche sind noch nicht implementiert.

---

## 2. Programmübersicht

Das Bierportal ist als Full-Stack-Webanwendung aufgebaut. Das Projekt liegt in einem gemeinsamen Nx-Monorepo und besteht aus:

- einem Angular-Frontend für die Benutzeroberfläche,
- einem NestJS-Backend für REST-Schnittstellen und Geschäftslogik,
- einer PostgreSQL-Datenbank für Benutzerkonten,
- einer Docker-Konfiguration für die lokale Datenbank,
- einer gemeinsamen TypeScript- und Nx-Werkzeugkette.

Der derzeitige fachliche Schwerpunkt ist die Benutzerverwaltung:

1. Benutzer können ein Konto mit Benutzername, E-Mail-Adresse und Passwort anlegen.
2. Benutzer können sich per E-Mail-Adresse oder Benutzername anmelden.
3. Alternativ ist eine Anmeldung beziehungsweise Registrierung über Google OAuth vorgesehen.
4. Das Backend speichert die Anmeldung in einem geschützten HTTP-only-Cookie.
5. Das Frontend lädt beim Start das aktuelle Benutzerprofil und steuert anhand dessen die erreichbaren Seiten.
6. Google-Benutzer ohne endgültigen Benutzernamen werden auf eine Seite zur Benutzernamenswahl geleitet.
7. Benutzer können sich abmelden.
8. Die Oberfläche unterstützt einen hellen und einen dunklen Darstellungsmodus.

---

## 3. Technische Architektur

### 3.1 Gesamtaufbau

```text
Browser
  |
  | Angular-Oberfläche, HTTP-Anfragen mit Cookies
  v
NestJS REST-API
  |
  | TypeORM
  v
PostgreSQL-Datenbank

Zusätzlicher externer Dienst:
Browser <-> Google OAuth <-> NestJS-Backend
```

### 3.2 Projektstruktur

```text
WebEng_Core/
├── apps/
│   ├── backend/                 NestJS-Anwendung
│   │   ├── src/config/          Konfigurationsprüfung
│   │   ├── src/database/        TypeORM-Datenquelle und Migrationen
│   │   ├── src/modules/auth/    Registrierung, Login, JWT und Google OAuth
│   │   └── src/modules/users/   Benutzerentität und Datenbankzugriff
│   └── frontend/                Angular-Anwendung
│       ├── src/app/core/        Authentifizierung, Guards und Dienste
│       ├── src/app/features/    Login, Registrierung, Benutzernamenswahl
│       ├── src/app/layout/      Header, Sidebar und Inhaltsbereich
│       └── src/environments/    API-Adressen je Umgebung
├── docker/                      PostgreSQL über Docker Compose
├── docs/                        Projektdokumentation
├── .env.example                 Vorlage für lokale Konfiguration
├── package.json                 Abhängigkeiten und Befehle
└── nx.json                      Nx-Arbeitsbereich
```

> Hinweis: Maßgeblich sind die realen Ordner- und Dateinamen im Repository. Die Kernbereiche befinden sich unter `apps/backend` und `apps/frontend`.

### 3.3 Eingesetzte Technologien

| Bereich | Technologie | Aufgabe |
|---|---|---|
| Frontend | Angular 21 | Benutzeroberfläche und Routing |
| Frontend-Zustand | Angular Signals und RxJS | Benutzerstatus, Theme, Ladezustände und HTTP-Abläufe |
| Backend | NestJS 11 | REST-API, Module, Guards und Geschäftslogik |
| Persistenz | TypeORM | Abbildung von TypeScript-Entitäten auf PostgreSQL |
| Datenbank | PostgreSQL 16 | Speicherung der Benutzerkonten |
| Authentifizierung | Passport, JWT, Google OAuth 2.0 | Lokale und externe Anmeldung |
| Passwortschutz | bcrypt | Sicheres Hashing lokaler Passwörter |
| API-Dokumentation | Swagger/OpenAPI | Interaktive Übersicht der Endpunkte |
| Sicherheit | Helmet, CORS, Rate Limiting | HTTP-Header, Herkunftskontrolle und Anfragelimits |
| Validierung | class-validator und Joi | Prüfung von Anfragen und Umgebungsvariablen |
| Arbeitsbereich | Nx | Gemeinsames Bauen, Testen und Prüfen beider Anwendungen |
| Infrastruktur | Docker Compose | Lokale PostgreSQL-Instanz |

---

## 4. Backend

## 4.1 Start und globale Initialisierung

Das Backend startet in `apps/backend/src/main.ts`. Beim Start werden folgende Funktionen eingerichtet:

- **Helmet** ergänzt verschiedene sicherheitsrelevante HTTP-Header.
- **Cookie Parser** liest Cookies aus eingehenden HTTP-Anfragen.
- **CORS** erlaubt Zugriffe nur von den in `CORS_ORIGIN` eingetragenen Frontend-Adressen.
- Bei CORS sind Zugangsdaten aktiviert, damit der Browser den Authentifizierungs-Cookie mitsendet.
- Erlaubte HTTP-Methoden sind GET, POST, PUT, DELETE und PATCH.
- Eine globale `ValidationPipe` prüft eingehende DTOs.
- Nicht definierte Felder werden entfernt; unerlaubte Zusatzfelder führen zu einem Fehler.
- Eingabewerte können automatisch in erwartete Datentypen umgewandelt werden.
- Unter `/api` wird eine Swagger-Oberfläche bereitgestellt.
- Der Server lauscht auf `PORT`, standardmäßig auf Port 3000.

Die Anwendung startet nicht sinnvoll ohne gültige Datenbank-, JWT- und Google-Konfiguration. Die Joi-Prüfung meldet alle fehlenden oder ungültigen Umgebungswerte gesammelt.

## 4.2 Zentrales Anwendungsmodul

Das `AppModule` verbindet die Hauptbestandteile:

- globale Konfiguration aus der `.env`-Datei,
- TypeORM-Verbindung zu PostgreSQL,
- Benutzermodul,
- Authentifizierungsmodul,
- globales Rate Limiting.

Das allgemeine Rate Limit beträgt 100 Anfragen pro 60 Sekunden. Einzelne sensible Endpunkte besitzen strengere Grenzwerte.

Im Entwicklungs- und Testbetrieb ist TypeORM-Synchronisierung eingeschaltet. Dadurch kann TypeORM das Schema an die Entitäten anpassen. In Produktion ist diese automatische Synchronisierung deaktiviert; dort sind Migrationen vorgesehen.

## 4.3 Basis- und Statusendpunkte

### `GET /`

Gibt den Text `Hello World!` zurück. Dieser Endpunkt dient momentan vor allem als einfacher Funktionstest des Backends.

### `GET /health`

Prüft die Datenbankverbindung mit `SELECT 1` und liefert:

- Gesamtstatus `ok` oder `error`,
- Verbindungsstatus der Datenbank,
- Datenbanktyp,
- Datenbankname,
- aktuellen ISO-Zeitstempel,
- im Fehlerfall eine Fehlermeldung.

Der Endpunkt liefert den Fehler als Antwortobjekt zurück, statt eine HTTP-Fehlerantwort zu werfen. Monitoring-Systeme müssten daher aktuell zusätzlich das Feld `status` auswerten.

## 4.4 Benutzer-Datenmodell

Benutzer werden in der Tabelle `users` gespeichert.

| Feld | Typ | Bedeutung |
|---|---|---|
| `id` | UUID | Automatisch erzeugter Primärschlüssel |
| `username` | Text, eindeutig | Öffentlicher Benutzername |
| `email` | Text, eindeutig | E-Mail-Adresse des Kontos |
| `passwordHash` | Text oder `null` | bcrypt-Hash bei lokaler Anmeldung |
| `googleId` | Text oder `null`, eindeutig | Google-Konto-ID bei OAuth-Anmeldung |
| `createdAt` | Zeitstempel mit Zeitzone | Zeitpunkt der Kontoerstellung |
| `picture` | Text oder `null` | Vorbereitetes Feld für ein Profilbild |
| `isUsernameSet` | Boolean | Kennzeichnet einen endgültig gewählten Benutzernamen |

Die berechneten Eigenschaften `hasPassword` und `hasGoogle` zeigen auf Entitätsebene an, welche Anmeldearten mit einem Konto verbunden sind. Sie werden aktuell nicht von einem API-Endpunkt ausgegeben oder im Frontend verwendet.

## 4.5 Benutzer-Datenzugriff

Der `UsersService` kapselt alle derzeitigen Datenbankoperationen:

- Benutzer anhand der UUID suchen,
- Benutzer anhand des Benutzernamens suchen,
- Benutzer anhand der E-Mail-Adresse suchen,
- Benutzer anhand der Google-ID suchen,
- Benutzer erstellen,
- Benutzerdaten aktualisieren,
- Benutzer löschen.

Der Service wird vom Authentifizierungsmodul verwendet. Ein eigener öffentlicher Users-Controller existiert noch nicht.

## 4.6 Registrierung mit E-Mail und Passwort

### Endpunkt

`POST /auth/register`

### Anfrage

```json
{
  "username": "bierfreund",
  "email": "bierfreund@example.com",
  "password": "Sicher123!"
}
```

### Ablauf

1. Das Backend validiert Benutzername, E-Mail-Adresse und Passwort.
2. Es prüft, ob der Benutzername bereits vergeben ist.
3. Es prüft, ob die E-Mail-Adresse bereits registriert ist.
4. Das Passwort wird mit bcrypt und einem Kostenfaktor von 12 gehasht.
5. Das Konto wird mit `isUsernameSet: true` gespeichert.
6. Die Antwort enthält nur ID und E-Mail-Adresse, nicht den Passwort-Hash.

### Validierungsregeln

- Benutzername: mindestens vier Zeichen.
- Benutzername: keine Leerzeichen, Kommas, Schrägstriche, Backslashes oder Ausrufezeichen.
- E-Mail-Adresse: muss syntaktisch gültig sein.
- Passwort: mindestens acht Zeichen.
- Passwort: mindestens ein Kleinbuchstabe, ein Großbuchstabe, eine Zahl und ein Sonderzeichen.
- Zusätzliche, unbekannte Felder sind nicht erlaubt.

### Schutz

Die Registrierung ist auf drei Anfragen pro 60 Sekunden begrenzt. Doppelte Benutzernamen und E-Mail-Adressen führen zu einem Konfliktfehler.

## 4.7 Anmeldung mit E-Mail oder Benutzername

### Endpunkt

`POST /auth/login`

### Anfrage

```json
{
  "identifier": "bierfreund@example.com",
  "password": "Sicher123!"
}
```

Das Feld `identifier` kann eine E-Mail-Adresse oder einen Benutzernamen enthalten. Enthält der Wert ein `@`, sucht das Backend nach einer E-Mail-Adresse, ansonsten nach einem Benutzernamen.

### Ablauf

1. Das passende Konto wird gesucht.
2. Konten ohne lokalen Passwort-Hash können sich nicht mit einem Passwort anmelden.
3. bcrypt vergleicht das eingegebene Passwort mit dem gespeicherten Hash.
4. Bei Erfolg wird ein signiertes JWT erzeugt.
5. Das JWT wird als Cookie namens `token` gespeichert.
6. Die Antwort enthält ID und E-Mail-Adresse.

### Cookie-Eigenschaften

- `httpOnly`: Browser-JavaScript kann den Token nicht direkt auslesen.
- `secure`: in Produktion wird der Cookie nur über HTTPS übertragen.
- `sameSite: strict`: reduziert das Risiko von Cross-Site-Request-Forgery.
- Lebensdauer: 15 Minuten.
- Pfad: `/`, daher für die gesamte API gültig.

Die Anmeldung ist auf fünf Versuche pro 60 Sekunden begrenzt. Bei unbekanntem Konto, fehlendem Passwort-Hash oder falschem Passwort wird einheitlich `Ungültige Anmeldedaten` zurückgegeben. Dadurch wird nicht verraten, ob ein Konto existiert.

## 4.8 JWT-Authentifizierung und Profil

### Endpunkt

`GET /auth/profile`

Der Endpunkt wird durch den `JwtAuthGuard` geschützt. Die JWT-Strategie liest den Token ausschließlich aus dem Cookie `token`, kontrolliert Signatur und Ablaufzeit und stellt anschließend folgende Daten bereit:

```json
{
  "id": "Benutzer-UUID",
  "email": "bierfreund@example.com",
  "username": "bierfreund",
  "isUsernameSet": true
}
```

Das Profil stammt momentan direkt aus dem JWT-Inhalt und wird nicht bei jedem Aufruf erneut aus der Datenbank geladen. Änderungen in der Datenbank erscheinen deshalb erst nach Ausstellung eines neuen Tokens im Profil.

## 4.9 Google-Anmeldung

### Start

`GET /auth/google`

Der Google-Guard leitet den Browser zur Google-Anmeldung weiter. Angefordert werden die Bereiche `email` und `profile`.

### Rückkehr

`GET /auth/google/callback`

Nach erfolgreicher Bestätigung verarbeitet das Backend Google-ID, E-Mail-Adresse und Verifizierungsstatus.

### Kontozuordnung

1. Existiert bereits ein Konto mit derselben Google-ID, wird es verwendet.
2. Existiert noch keine Google-ID, aber ein Konto mit derselben von Google bestätigten E-Mail-Adresse, wird das Google-Konto mit diesem bestehenden Konto verknüpft.
3. Andernfalls wird ein neues Konto angelegt.
4. Ein neues Google-Konto erhält zunächst einen technisch eindeutigen temporären Benutzernamen im Format `user_<UUID>`.
5. `isUsernameSet` bleibt in diesem Fall `false`.

Nach der Anmeldung stellt das Backend ebenfalls einen JWT-Cookie aus. Benutzer mit endgültigem Benutzernamen werden zu `/dashboard` weitergeleitet; neue Google-Benutzer zu `/choose-username`.

## 4.10 Benutzernamen nach Google-Anmeldung festlegen

### Endpunkt

`PATCH /auth/set-username`

Der Endpunkt ist JWT-geschützt und erwartet:

```json
{
  "username": "mein_biername"
}
```

Das Backend prüft, ob der Name bereits vergeben ist, aktualisiert das Konto und setzt `isUsernameSet` auf `true`. Die Antwort enthält ID, E-Mail-Adresse, Benutzernamen und Status.

Für diesen Body existiert aktuell kein eigenes DTO. Dadurch werden hier nicht dieselben detaillierten Formatregeln wie bei der Registrierung angewandt. Außerdem bleibt das bereits ausgestellte JWT nach der Änderung unverändert, obwohl die API-Antwort dem Frontend den aktuellen Benutzer liefert.

## 4.11 Abmeldung

### Endpunkt

`POST /auth/logout`

Das Backend entfernt den `token`-Cookie mit denselben relevanten Cookie-Einstellungen und bestätigt die Abmeldung mit `Logout erfolgreich`.

Der Endpunkt ist nicht durch einen JWT-Guard geschützt. Das ist für eine Abmeldung üblich, da auch ein bereits abgelaufener oder ungültiger Cookie entfernt werden können soll.

## 4.12 Vorbereitete Kontolöschung

Im `AuthService` und `UsersService` ist das Löschen eines Benutzers technisch vorbereitet. Ein entsprechender Controller-Endpunkt ist jedoch auskommentiert beziehungsweise nicht implementiert. Benutzer können ihr Konto daher über die aktuelle API noch nicht löschen.

## 4.13 API-Übersicht

| Methode | Route | Anmeldung nötig | Funktion | Status |
|---|---|---:|---|---|
| GET | `/` | Nein | Einfacher Backend-Funktionstest | Implementiert |
| GET | `/health` | Nein | Datenbankstatus prüfen | Implementiert |
| POST | `/auth/register` | Nein | Lokales Konto registrieren | Implementiert |
| POST | `/auth/login` | Nein | Mit E-Mail/Benutzername und Passwort anmelden | Implementiert |
| GET | `/auth/profile` | Ja | Aktuelle JWT-Profildaten laden | Implementiert |
| PATCH | `/auth/set-username` | Ja | Benutzernamen nach OAuth setzen | Implementiert |
| POST | `/auth/logout` | Nein | Authentifizierungs-Cookie entfernen | Implementiert |
| GET | `/auth/google` | Nein | Google OAuth starten | Implementiert |
| GET | `/auth/google/callback` | Über Google | Google OAuth abschließen | Implementiert |
| DELETE | Benutzerkonto | Ja | Konto löschen | Nur intern vorbereitet |

---

## 5. Frontend

## 5.1 Start der Angular-Anwendung

Das Frontend verwendet Angular Standalone Components. `main.ts` startet die Root-Komponente mit der zentralen Anwendungskonfiguration.

Beim Start werden eingerichtet:

- Angular Router,
- HTTP-Client,
- Credentials-Interceptor,
- globaler Browser-Fehlerlistener,
- Authentifizierungs-Initialisierung.

Der App-Initializer ruft vor der regulären Navigation `/auth/profile` auf. Ein gültiger Cookie setzt den Benutzerzustand; bei einem Fehler oder fehlender Sitzung wird der Zustand auf `null` gesetzt. Dadurch kennen die Route Guards bereits beim ersten Seitenaufbau den Anmeldestatus.

## 5.2 Authentifizierungszustand

Der `Auth`-Dienst ist die zentrale Frontend-Schnittstelle zur Authentifizierung. Er hält den aktuellen Benutzer in einem Angular Signal:

```text
user = angemeldeter Benutzer oder null
```

Der Dienst stellt folgende Funktionen bereit:

- lokales Login an das Backend senden,
- Google-Anmeldung durch vollständige Browserweiterleitung starten,
- einen Benutzernamen setzen,
- die Abmeldung aufrufen,
- das aktuelle Profil laden,
- den globalen Benutzerzustand aktualisieren.

## 5.3 Automatisches Mitsenden des Cookies

Der Credentials-Interceptor klont jede HTTP-Anfrage des Angular-Clients mit `withCredentials: true`. Dadurch sendet der Browser den HTTP-only-Cookie auch bei Anfragen an das lokal auf einem anderen Port laufende Backend mit.

Diese Funktion ist wesentlich, weil der JWT nicht im Local Storage und nicht im JavaScript-Zustand gespeichert wird.

## 5.4 Routing und Zugriffsschutz

| Frontend-Route | Komponente | Schutz | Zweck |
|---|---|---|---|
| `/login` | `Login` | `guestGuard` | Lokale oder Google-Anmeldung |
| `/register` | `Register` | `guestGuard` | Neues Konto anlegen |
| `/choose-username` | `ChooseUsername` | `authGuard`, `usernameGuard` | Endgültigen Namen nach OAuth wählen |
| `/` | `Layout` | Kein Guard | Grundlayout der Anwendung |
| alle unbekannten Routen | Weiterleitung | – | Weiterleitung zu `/login` |

### Auth Guard

Der `authGuard` lässt nur angemeldete Benutzer passieren. Ohne Benutzerzustand erfolgt eine Weiterleitung zu `/login`.

### Guest Guard

Der `guestGuard` verhindert, dass angemeldete Benutzer die Login- oder Registrierungsseite öffnen. Sie werden zur Hauptroute `/` geschickt.

### Username Guard

Der `usernameGuard` verhindert, dass Benutzer mit bereits festgelegtem Benutzernamen erneut die Seite zur Namenswahl öffnen. Sie werden zur Hauptroute weitergeleitet.

Die Hauptroute selbst ist aktuell nicht mit dem `authGuard` geschützt. Somit kann auch ein nicht angemeldeter Besucher das leere Hauptlayout sehen.

## 5.5 Login-Seite

Die Login-Seite bietet:

- Eingabe für E-Mail-Adresse oder Benutzername,
- Passwortfeld,
- Absenden der lokalen Anmeldung,
- allgemeine Fehlermeldung bei fehlgeschlagener Anmeldung,
- Start der Google-Anmeldung,
- Link zur Registrierung.

Bei erfolgreichem Login wird die Antwort in den globalen Benutzerzustand geschrieben. Eine anschließende Navigation zur Hauptseite findet im aktuellen Code jedoch nicht statt. Der Benutzer bleibt daher zunächst auf der Login-Seite, bis eine Navigation oder ein erneuter Seitenaufruf erfolgt.

Die Oberfläche ist als zentrierte Authentifizierungskarte gestaltet und verwendet grüne Aktionsflächen, Formularelemente, Trennlinie und Google-Schaltfläche.

## 5.6 Registrierungsseite

Die Registrierungsseite bietet Felder für:

- Benutzername,
- E-Mail-Adresse,
- Passwort,
- Passwortbestätigung.

Das Frontend prüft, ob beide Passwörter übereinstimmen. Bei Übereinstimmung sendet es die Registrierungsdaten an das Backend. Nach erfolgreicher Registrierung navigiert es zur Login-Seite.

Weitere fachliche Regeln wie Passwortstärke und Benutzername werden primär im Backend geprüft. Backend-Fehler werden im Frontend derzeit als allgemeine Meldung `Registration failed. Please try again.` dargestellt.

Zusätzlich gibt es:

- eine Google-Registrierung über denselben OAuth-Ablauf wie beim Login,
- einen Link zurück zur Login-Seite.

## 5.7 Seite zur Benutzernamenswahl

Die Seite richtet sich hauptsächlich an neu angelegte Google-Benutzer. Sie bietet:

- ein Eingabefeld für den endgültigen Benutzernamen,
- eine Speichern-Schaltfläche,
- einen Ladezustand während der Anfrage,
- eine Fehlermeldung bei ungültigem oder vergebenem Namen,
- eine Schaltfläche zum vorläufigen Überspringen.

Beim erfolgreichen Speichern wird der globale Benutzerzustand aktualisiert und zur Hauptroute navigiert. Beim Überspringen wird ebenfalls zur Hauptroute navigiert, ohne den Namen zu ändern.

## 5.8 Hauptlayout

Das Grundlayout besteht aus:

- einem Header,
- einer Sidebar,
- einem Inhaltsbereich mit verschachteltem Router Outlet.

Der Header enthält derzeit nur den Umschalter für Hell- und Dunkelmodus. Die Sidebar zeigt aktuell lediglich den Text `sidebar`. Für das Layout sind noch keine fachlichen Unterseiten als Child-Routes eingetragen. Der Inhaltsbereich bleibt deshalb leer.

## 5.9 Theme-Funktion

Der `ThemeService` unterstützt die Modi `light` und `dark`.

Beim Start gilt folgende Priorität:

1. Ein zuvor in `localStorage` gespeichertes Theme wird verwendet.
2. Ohne gespeicherte Auswahl wird die Systemeinstellung des Browsers übernommen.

Bei einer Änderung:

- setzt der Dienst `data-theme` am HTML-Wurzelelement,
- speichert die Wahl unter `app-theme` im Local Storage,
- aktualisieren sich Farben über globale CSS-Variablen.

Definiert sind unter anderem Farben für Hintergründe, Karten, Texte, Akzent, Rahmen, Schatten, Erfolg, Warnung und Fehler. Der Header stellt dafür einen visuellen Kippschalter bereit.

## 5.10 Ladezustandsdienst

Der `LoadingService` verwaltet einen global beobachtbaren Ladezustand. Ein interner Zähler unterstützt mehrere gleichzeitig laufende Vorgänge:

- `show()` erhöht den Zähler und aktiviert den Ladezustand.
- `hide()` verringert den Zähler.
- Erst bei Zählerstand null wird der Ladezustand deaktiviert.

Der Dienst ist implementiert, aber aktuell noch nicht an einen globalen Spinner oder HTTP-Interceptor angeschlossen.

## 5.11 Toast-Benachrichtigungen

Eine Datei für einen `ToastService` ist angelegt, enthält aber noch keine Implementierung. Die Anwendung verwendet derzeit direkt in den Seiten eingeblendete Fehlermeldungen.

## 5.12 Umgebungsabhängige API-Adressen

- Entwicklung: `http://localhost:3000`
- Produktion: `/api`

Die Produktionskonfiguration erwartet damit üblicherweise, dass Frontend und Backend über dieselbe Domain erreichbar sind und ein Webserver oder Reverse Proxy `/api` an das Backend weiterleitet.

---

## 6. Zentrale Benutzerabläufe

## 6.1 Lokale Registrierung

```text
Registrierungsseite
  -> Passwörter im Frontend vergleichen
  -> POST /auth/register
  -> Eingaben im Backend validieren
  -> E-Mail und Benutzername auf Eindeutigkeit prüfen
  -> Passwort mit bcrypt hashen
  -> Benutzer in PostgreSQL speichern
  -> zur Login-Seite wechseln
```

Die Registrierung meldet den Benutzer nicht automatisch an.

## 6.2 Lokale Anmeldung

```text
Login-Seite
  -> POST /auth/login
  -> Benutzer über E-Mail oder Benutzername suchen
  -> Passwort-Hash vergleichen
  -> JWT erzeugen
  -> JWT als HTTP-only-Cookie setzen
  -> Benutzerantwort im Angular-Signal speichern
```

Bei späteren Aufrufen sendet der Browser den Cookie automatisch mit.

## 6.3 Wiederherstellung einer Sitzung

```text
Angular startet
  -> App-Initializer ruft GET /auth/profile auf
  -> Credentials-Interceptor sendet Cookie mit
  -> JWT-Guard validiert Token
  -> Benutzerzustand wird gesetzt oder auf null gesetzt
  -> Router Guards entscheiden über den Seitenzugriff
```

## 6.4 Google OAuth

```text
Google-Schaltfläche
  -> Browser öffnet GET /auth/google
  -> Weiterleitung zu Google
  -> Benutzer bestätigt Anmeldung
  -> Google ruft /auth/google/callback auf
  -> Konto suchen, verknüpfen oder erstellen
  -> JWT-Cookie setzen
  -> mit Benutzername: Weiterleitung zu /dashboard
  -> ohne Benutzername: Weiterleitung zu /choose-username
```

## 6.5 Abmeldung

```text
Frontend ruft POST /auth/logout auf
  -> Backend löscht Cookie
  -> zukünftige Profilanfragen sind nicht mehr authentifiziert
```

Eine sichtbare Logout-Schaltfläche und das Zurücksetzen des Benutzer-Signals sind im aktuellen Layout noch nicht angeschlossen.

---

## 7. Sicherheit

### Bereits umgesetzt

- Passwörter werden nicht im Klartext gespeichert.
- bcrypt verwendet einen Kostenfaktor von 12.
- JWTs werden in HTTP-only-Cookies gehalten.
- Sichere Cookies werden im Produktionsmodus erzwungen.
- `SameSite=Strict` begrenzt Cross-Site-Anfragen.
- CORS ist auf konfigurierte Ursprünge eingeschränkt.
- Anmeldedaten werden browserseitig mit `withCredentials` übertragen.
- JWT-Signatur und Ablaufdatum werden kontrolliert.
- DTO-Validierung entfernt oder verbietet unerwartete Eingaben.
- Helmet setzt sichere HTTP-Header.
- Globales und endpunktspezifisches Rate Limiting reduziert Missbrauch.
- Login-Fehler verraten nicht, ob ein Benutzer existiert.
- Ein JWT-Secret mit mindestens 32 Zeichen ist vorgeschrieben.

### Zu beachtende Punkte

- Die Cookie-Lebensdauer ist fest auf 15 Minuten gesetzt, während die JWT-Lebensdauer über `JWT_EXPIRATION` konfigurierbar ist. Beide Werte können auseinanderlaufen.
- Es gibt keinen Refresh-Token. Nach Ablauf ist eine erneute Anmeldung nötig.
- Es gibt keine E-Mail-Verifizierung für lokal registrierte Konten.
- Es gibt keine Passwort-zurücksetzen-Funktion.
- Für `set-username` fehlt ein DTO mit denselben Regeln wie bei der Registrierung.
- Die Hauptroute ist nicht geschützt.
- Die Profildaten kommen aus dem JWT und können bis zum nächsten Login veraltet sein.
- Ein Schutz gegen doppelte Werte beruht zusätzlich auf Datenbank-Constraints; parallele Registrierung kann daher einen Datenbankfehler statt einer einheitlichen Konfliktmeldung erzeugen.
- Eine produktive Installation benötigt HTTPS und eine korrekt abgestimmte Cookie-, CORS- und Proxy-Konfiguration.

---

## 8. Konfiguration

Die Anwendung erwartet eine `.env`-Datei im Projektstamm.

| Variable | Zweck | Vorgabe/Standard |
|---|---|---|
| `NODE_ENV` | Laufzeitmodus | `development`, `production` oder `test` |
| `PORT` | Backend-Port | Standard 3000 |
| `DB_HOST` | Datenbankserver | Erforderlich |
| `DB_PORT` | PostgreSQL-Port | Standard 5432 |
| `DB_USER` | Datenbankbenutzer | Erforderlich |
| `DB_PASS` | Datenbankpasswort | Erforderlich |
| `DB_NAME` | Datenbankname | Erforderlich |
| `CORS_ORIGIN` | Erlaubte Frontend-Ursprünge, kommagetrennt | Zur Laufzeit erforderlich |
| `FRONTEND_URL` | Basisadresse für OAuth-Weiterleitungen | Erforderlich |
| `JWT_SECRET` | Schlüssel zum Signieren der JWTs | Mindestens 32 Zeichen |
| `JWT_EXPIRATION` | Lebensdauer eines JWT | Standard 15 Minuten |
| `GOOGLE_CLIENT_ID` | Google-OAuth-Client | Erforderlich |
| `GOOGLE_CLIENT_SECRET` | Google-OAuth-Geheimnis | Erforderlich |
| `GOOGLE_CALLBACK_URL` | Registrierte Google-Rücksprungadresse | Gültige URL erforderlich |

`API_URL` steht in der Beispieldatei, wird im Backend aktuell aber nicht ausgewertet. Das Frontend verwendet kompilierte Angular-Environment-Dateien für seine API-Adresse.

---

## 9. Datenbank und Docker

Docker Compose startet einen PostgreSQL-16-Dienst namens `db`.

Eigenschaften:

- automatischer Neustart, solange der Dienst nicht bewusst gestoppt wurde,
- Portfreigabe `5432:5432`,
- Zugangsdaten und Datenbankname aus `.env`,
- persistentes Volume `pgdata`,
- Healthcheck über `pg_isready` alle fünf Sekunden,
- fünf Wiederholungsversuche mit jeweils fünf Sekunden Timeout.

Das Volume sorgt dafür, dass Daten beim normalen Stoppen und erneuten Starten des Containers erhalten bleiben.

TypeORM besitzt eine separate Datenquellenkonfiguration für Migrationen. Die Verzeichnisse `database/migration` und `database/seeds` sind vorbereitet, enthalten aber noch keine Migrationen oder Seed-Daten.

---

## 10. Entwicklung, Build und Tests

### Wichtige Befehle

| Befehl | Wirkung |
|---|---|
| `npm install` | Abhängigkeiten installieren |
| `npm run docker:up` | PostgreSQL starten |
| `npm run docker:down` | PostgreSQL stoppen |
| `npm run docker:logs` | Datenbankprotokoll verfolgen |
| `npm run backend:start:dev` | Backend für Entwicklung bauen und starten |
| `npm run frontend:start` | Angular-Entwicklungsserver starten |
| `npm run backend:build` | Backend bauen |
| `npm run frontend:build` | Frontend bauen |
| `npm run build` | Beide Anwendungen bauen |
| `npm run test` | Tests aller Nx-Projekte ausführen |
| `npm run lint` | Codeprüfung aller Nx-Projekte ausführen |
| `npm run format` | unterstützte Dateien formatieren |
| `npm run migration:generate -- <Pfad>` | TypeORM-Migration erzeugen |
| `npm run migration:run` | Migrationen anwenden |
| `npm run migration:revert` | letzte Migration zurücknehmen |

### Vorhandene Tests

Backend:

- Unit-Test für den Basis-Controller,
- simulierte DataSource für den Controller-Test,
- End-to-End-Test für `GET /`.

Frontend:

- Root-Komponente wird erzeugt,
- Auth-Dienst wird erzeugt,
- Login-Anfrage sendet erwartete Daten,
- HTTP-401-Fehler werden weitergereicht,
- Login-Komponente wird erzeugt,
- Credentials-Interceptor kann instanziiert werden.

Die Tests decken bisher nur einen kleinen Teil des tatsächlichen Authentifizierungsablaufs ab. Insbesondere Registrierung, Guards, Google OAuth, Benutzernamenswahl, Logout, Theme und echte Datenbankintegration sind noch nicht vollständig getestet.

### Verifizierter Stand am 5. September 2026

- Backend-Typprüfung: erfolgreich.
- Backend-Produktionsbuild: erfolgreich.
- Backend-Unit-Tests: ein Test, erfolgreich.
- Frontend-Typprüfung: erfolgreich.
- Frontend-Produktionsbuild: beim Angular/esbuild-Bauvorgang ohne konkrete Compilerdiagnose fehlgeschlagen.
- Frontend-Tests: vier von sieben Tests erfolgreich; drei Tests schlagen wegen unvollständiger Testumgebung beziehungsweise veralteter Erwartungen fehl.

Die Frontend-Testfehler betreffen ein fehlendes `window.matchMedia`-Mock für den Theme-Dienst, einen fehlenden Router-Provider im Login-Komponententest und die veraltete Erwartung einer Überschrift in der Root-Komponente. Sie belegen nicht automatisch einen Fehler im normalen Browserbetrieb, sollten aber behoben werden, damit die Testsuite wieder verlässlich als Qualitätskontrolle dient.

---

## 11. Aktueller Implementierungsstand

### Vollständig oder weitgehend implementiert

- Nx-Monorepo mit getrenntem Frontend und Backend,
- PostgreSQL-Anbindung,
- Benutzerentität und grundlegende Datenbankoperationen,
- lokale Registrierung,
- lokale Anmeldung per E-Mail oder Benutzername,
- Passwort-Hashing,
- JWT-Erstellung und -Prüfung,
- Cookie-basierte Sitzung,
- Profilendpunkt,
- Google-OAuth-Grundablauf,
- Verknüpfung eines Google-Kontos über bestätigte E-Mail,
- nachträgliche Benutzernamenswahl,
- Backend-Abmeldung,
- Frontend-Routen und Guards,
- persistenter Hell-/Dunkelmodus,
- Health-Endpunkt,
- Swagger-Grundkonfiguration,
- Docker-PostgreSQL-Konfiguration,
- grundlegende Unit- und End-to-End-Tests.

### Vorbereitet, aber noch nicht angeschlossen

- Benutzerlöschung im Service,
- Profilbildfeld,
- Ladezustandsdienst,
- Toast-Service-Datei,
- Sidebar und Hauptlayout,
- verschachtelte Fachseiten,
- TypeORM-Migrations- und Seed-Verzeichnisse,
- Swagger-Bearer-Auth-Schema.

### Noch nicht implementierte Bierportal-Fachfunktionen

- Bierdatenbank oder Bierkatalog,
- Brauereien,
- Biersorten und Kategorien,
- Detailseiten für Biere,
- Suche, Sortierung und Filter,
- Bewertungen und Rezensionen,
- Favoriten oder Merklisten,
- Benutzerprofile als sichtbare Seite,
- Bilder-Upload,
- Empfehlungen,
- Rollen- und Rechteverwaltung,
- Administrationsbereich,
- Dashboard-Inhalte.

---

## 12. Bekannte funktionale Lücken und Inkonsistenzen

1. **Google-Zielroute fehlt:** Das Backend leitet bestehende Google-Benutzer zu `/dashboard`. Diese Route ist im Angular-Router nicht definiert und fällt deshalb auf die Wildcard-Weiterleitung zu `/login` zurück.
2. **Hauptroute ungeschützt:** Das Layout unter `/` kann ohne Anmeldung geöffnet werden.
3. **Login navigiert nicht:** Nach erfolgreicher lokaler Anmeldung wird zwar der Benutzerzustand gesetzt, aber keine Zielseite geöffnet.
4. **Logout nicht sichtbar:** Der Backend-Endpunkt und die Frontend-Methode existieren, es gibt aber keine Logout-Schaltfläche im Layout.
5. **Benutzername überspringbar:** Ein neuer Google-Benutzer kann die Namenswahl überspringen, obwohl `isUsernameSet` dann `false` bleibt.
6. **JWT nach Namensänderung veraltet:** Das Frontend setzt zwar die aktuelle API-Antwort, nach einem Reload liefert das alte JWT aber weiterhin den ursprünglichen temporären Namen und `isUsernameSet: false`.
7. **Unvollständige Validierung bei Namenswahl:** Der Patch-Endpunkt nutzt kein validiertes DTO.
8. **Frontend-Loginantwort unvollständig:** Das Backend gibt beim lokalen Login nur ID und E-Mail zurück, während das Frontend den Rückgabewert als vollständigen `AuthUser` mit Benutzername und `isUsernameSet` typisiert.
9. **Styles uneinheitlich benannt:** Globale Buttons verwenden Modifikatoren wie `.btn--primary`, die Auth-Seiten verwenden `.btn-primary`. Das funktioniert lokal, erschwert aber die Wiederverwendung.
10. **Google-Icon-Pfad wahrscheinlich falsch:** Die Templates verweisen auf `public/google.ico`. Angular kopiert den Inhalt des Public-Ordners normalerweise an den Webroot, daher wäre `/google.ico` der typische Pfad.
11. **Root-Komponententest veraltet:** Der Test erwartet eine `h1`-Überschrift, während die Root-Vorlage nur das Router Outlet enthält.
12. **Health-Fehlerstatus:** Ein Datenbankfehler erzeugt ein JSON-Objekt mit `status: error`, wahrscheinlich aber weiterhin HTTP 200.
13. **Produktionsrouting nicht vollständig dokumentiert:** `apiUrl: /api` benötigt einen Reverse Proxy; die Backend-Routen selbst besitzen jedoch kein globales `/api`-Präfix. Die Proxy-Regel muss dieses Präfix passend entfernen oder weiterleiten.
14. **Docker-Dokumentation nennt falschen Variablennamen:** In `docker/README.md` steht `DB_PASSWORD`, der Compose- und Backend-Code verwendet `DB_PASS`.
15. **Pflichtwerte für Google:** Auch wenn nur lokale Anmeldung verwendet werden soll, verlangt das Konfigurationsschema derzeit alle Google-OAuth-Werte.

Diese Punkte bedeuten nicht, dass die Architektur grundsätzlich fehlerhaft ist. Sie zeigen, welche Übergänge beim Zusammenführen des Projekts noch fertiggestellt werden sollten.

---

## 13. Sinnvolle nächste Ausbauschritte

### Priorität 1: Authentifizierungsablauf schließen

- `/dashboard` anlegen oder Google-Weiterleitung auf `/` ändern,
- Hauptroute mit `authGuard` schützen,
- nach lokalem Login navigieren,
- sichtbaren Logout ergänzen und `auth.user` leeren,
- ein DTO für `set-username` verwenden,
- nach Namensänderung ein neues JWT ausstellen,
- Loginantwort und `AuthUser`-Typ angleichen.

### Priorität 2: Kontoverwaltung vervollständigen

- Profilseite anlegen,
- Kontolöschung geschützt anbieten,
- Passwortänderung und Passwort-Reset ergänzen,
- lokale E-Mail-Verifizierung ergänzen,
- Profilbildfunktion umsetzen.

### Priorität 3: Eigentliche Bierportal-Funktionen

- Entitäten für Bier, Brauerei, Kategorie und Bewertung modellieren,
- REST-Endpunkte mit Rollen- und Besitzprüfungen entwickeln,
- Katalog-, Detail-, Such- und Bewertungsseiten erstellen,
- Favoriten und persönliche Übersichten ergänzen,
- Administrationsfunktionen definieren.

### Priorität 4: Qualität und Betrieb

- Migrationen statt automatischer Schema-Synchronisierung pflegen,
- Testabdeckung für alle Auth-Abläufe erhöhen,
- Swagger-Endpunkte und DTO-Antworten vollständig beschreiben,
- produktiven Reverse Proxy und HTTPS konfigurieren,
- standardisierte Fehlerdarstellung und Toasts ergänzen,
- Ladezustände global anschließen,
- Health-Endpunkt mit passenden HTTP-Statuscodes ausstatten.

---

## 14. Kurzfazit

Das Projekt bildet derzeit ein solides technisches Grundgerüst für ein Bierportal. Backend und Frontend sind in einem Nx-Monorepo organisiert und über eine REST-API verbunden. Benutzerkonten können lokal oder über Google angelegt werden. Passwörter werden sicher gehasht, Sitzungen mit JWT-Cookies geführt und geschützte Backend-Funktionen über Passport Guards abgesichert. Das Angular-Frontend bringt Registrierungs-, Login- und Benutzernamensseiten sowie Routing, Sitzungswiederherstellung und Theme-Umschaltung mit.

Der aktuelle Entwicklungsstand ist jedoch eher eine **Authentifizierungs- und Layoutbasis** als ein fertiges Bierportal. Die eigentlichen Bierfunktionen fehlen noch, und einige Übergänge des Login-Ablaufs müssen nach dem Zusammenführen bereinigt werden. Die vorhandene Struktur eignet sich aber gut dafür, darauf Katalog, Bewertungen, Favoriten, Profile und Administration aufzubauen.
