# Notenrechner

Interaktiver Notenrechner für das Schweizer Schulsystem — mit Benutzer-Login, zentraler Schüler-Bibliothek und zustandsbasierten Prüfungen.

## Funktionen

- **Benutzer-Login** (Invite-Code-geschützt) mit bcrypt + JWT
- **Schüler-Bibliothek** — Name, Klasse, Stufe, Notizen — einmal anlegen, in jeder Prüfung wählbar
- **Prüfungen** mit konfigurierbaren Kurven (Linear, Grosszügig, Streng), Punkten-pro-Note-Ankern, Rundungsstufen
- **Charts**: Notenverteilung, Notenkurve, Boxplot, Live-Statistiken
- **What-if-Solver** — berechnet den Punkte-Anker für eine Ziel-Bestehensquote
- **Undo / Redo** mit History
- **CSV Import / Export**, Drag-and-drop
- **Keyboard Shortcuts** (⌘N / ⌘Z / ⌘⇧Z / ⌘P)
- **i18n** — Deutsch, Englisch, Französisch
- **Dark Mode** mit Liquid-Glass-Design
- **Multi-Device** — selbe Daten auf allen Geräten nach Login

## Stack

| Ebene | Tech |
|---|---|
| Frontend | Vite 6 + React 19 + TypeScript strict + Tailwind v4 + Radix UI + Zustand + Framer Motion + Recharts |
| Backend | Fastify 5 + `@libsql/client` (SQLite/Turso) + bcrypt + JWT + Zod |
| Security | `@fastify/helmet`, `@fastify/rate-limit`, Content-Security-Policy, body limits |
| Tests | Vitest (48 Unit-Tests) + Playwright (E2E) |
| Deployment | Vercel (frontend + serverless function) + Turso (remote DB) |

## Lokale Entwicklung

```bash
# Frontend
npm install --legacy-peer-deps
npm run dev                 # http://localhost:5173

# Backend (in a second terminal)
cd server
npm install --legacy-peer-deps
cp .env.example .env        # set JWT_SECRET (openssl rand -hex 32) + INVITE_CODE
npm run dev                 # http://localhost:3000
```

## Testen

```bash
npm run test                # Unit tests (48 passing)
npm run test:coverage       # With coverage
npm run test:e2e            # Playwright
npm run build               # Full typecheck + production build
```

## Deployment

Siehe [DEPLOYMENT.md](DEPLOYMENT.md) für die Schritt-für-Schritt-Anleitung für Vercel + Turso inkl. aller Security-Einstellungen.

## Projektstruktur

```
.
├── api/                    Vercel serverless entry (wraps Fastify)
├── server/                 Fastify backend
│   ├── src/routes/         auth, students, exams
│   ├── src/db.ts           libSQL client (file:// lokal, Turso in prod)
│   └── src/app.ts          Security middleware stack
├── src/                    React frontend
│   ├── domain/             Grading engine, stats, CSV (pure, 100% tested)
│   ├── services/
│   │   ├── api/            HTTP clients für auth/students/exams
│   │   └── storage/        Legacy IndexedDB (nicht mehr aktiv)
│   ├── state/              Zustand stores (auth, library, exams)
│   ├── i18n/               DE/EN/FR Wörterbücher
│   ├── components/ui/      Button, Input, Dialog, Select, Slider, Card
│   ├── features/
│   │   ├── auth/           Login / Register
│   │   ├── library/        Schüler-Bibliothek
│   │   ├── students/       Tabelle innerhalb einer Prüfung
│   │   ├── exams/          Selector, Modals, RosterPicker
│   │   ├── config/         Grading-Konfiguration
│   │   ├── charts/         Distribution, Curve, BoxPlot
│   │   ├── stats/          Statistik-Kacheln
│   │   └── whatif/         Reverse solver
│   └── hooks/              useKeyboardShortcuts
├── tests/                  e2e + setup
├── vercel.json             Vercel config + security headers
└── DEPLOYMENT.md           Vercel + Turso walkthrough
```

## Migration von V1

V1 ist im Branch `v1-archive` erhalten. V2 ist eine komplett neue Codebase, die dieselbe UX-Idee radikal aufbessert: strikte Typen, vollständige Tests, echte Multi-User-Persistenz, Security-Hardening.

## Lizenz

Dasselbe wie V1.
