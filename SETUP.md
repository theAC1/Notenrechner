# Notenrechner V2 — Setup mit Benutzer-Login

## Architektur

```
[Frontend — Vite + React]  ──HTTP──▶  [Backend — Fastify + SQLite]
  localhost:5173                         localhost:3000
                                         data/notenrechner.db
```

**Stack:**
- Backend: Fastify + `@libsql/client` (SQLite in einer Datei) + bcrypt + JWT
- Auth: JWT in `localStorage` (Bearer-Header)
- Persistenz: SQLite-Datei `server/data/notenrechner.db` (kommt automatisch)

## Datenmodell

- **users** — E-Mail, bcrypt-Passwort-Hash
- **students** — pro User: `name`, `klasse`, `stufe`, `notes` (die „Bibliothek")
- **exams** — pro User: `name`, `subject`, `date`, `config_json`
- **exam_students** — Junction: welcher Schüler mit wie vielen Punkten in welcher Prüfung

Einmal in der Bibliothek erfasst ⇒ Schüler ist in jeder Prüfung wählbar.

## Installation

### 1. Frontend
```bash
cd v2-notenrechner
npm install --legacy-peer-deps
```

### 2. Backend
```bash
cd server
npm install --legacy-peer-deps
cp .env.example .env
# .env öffnen und JWT_SECRET auf einen eigenen, mind. 32-Zeichen-Wert setzen
```

## Entwicklung (2 Terminals)

```bash
# Terminal 1 — Backend
cd server && npm run dev
# → http://localhost:3000

# Terminal 2 — Frontend
cd v2-notenrechner && npm run dev
# → http://localhost:5173
```

## Produktions-Deployment (ein Prozess)

```bash
# Frontend bauen
cd v2-notenrechner && npm run build
# → dist/ wird erstellt

# Backend bauen
cd server && npm run build
# → server/dist/ wird erstellt

# Starten (serviert API UND statisches Frontend auf einem Port)
cd server && npm start
# → http://localhost:3000
```

Fastify liefert automatisch `../dist` (Frontend) aus und hat SPA-Fallback auf `index.html` für Client-Routing.

### Deployment-Optionen

**Einfachste:** VPS / Raspberry Pi / Shared Hosting mit Node.js

```bash
# Auf dem Host
git clone <repo> && cd v2-notenrechner
npm install --legacy-peer-deps && cd server && npm install --legacy-peer-deps
# JWT_SECRET in server/.env setzen
npm run build && cd .. && npm run build
cd server && npm start
```

**Hinter Nginx:** Reverse-Proxy auf `:3000`, HTTPS-Termination bei Nginx.

**Backup:** Einfach `server/data/notenrechner.db` kopieren. SQLite nutzt WAL-Mode, also live kopieren ist safe.

## Nutzung

1. **Erste Registrierung**: App öffnen → "Jetzt registrieren" → E-Mail + Passwort
2. **Tab „Bibliothek"**: Schüler anlegen (Name + Klasse + Stufe). Einzeln oder per CSV-Import.
3. **Tab „Prüfungen"**: Neue Prüfung → aus der Bibliothek Schüler auswählen (filterbar nach Klasse).
4. Punkte eintragen → Noten werden live berechnet und in der DB gespeichert.

Alles liegt in `server/data/notenrechner.db`. Jeder User sieht nur seine eigenen Daten (isoliert via `user_id` + JWT).

## Sicherheit

- Passwörter: bcrypt (10 rounds)
- JWT: HS256, 30 Tage Gültigkeit, Secret muss ≥ 32 Zeichen sein
- SQL-Injection: alle Queries parametrisiert via `@libsql/client`
- Ownership-Checks: jede API-Route prüft `user_id` gegen JWT-Claim
- CORS: konfigurierbar über `CORS_ORIGIN` in `server/.env`
