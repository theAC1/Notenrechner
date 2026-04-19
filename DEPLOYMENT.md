# Deployment — Vercel + Turso

## Why these choices

Vercel is serverless: functions run on-demand, and the filesystem **does not persist between calls**. A local SQLite file would be wiped. So we pair Vercel with **Turso**, which speaks the same libSQL dialect our code already uses — we change one URL and the app keeps working.

```
┌─────────────── Vercel ───────────────┐        ┌─── Turso ───┐
│  Static frontend (dist/)             │        │  libSQL DB  │
│  + Serverless function /api/*        ├─http──▶│             │
│    (Fastify wrapped)                 │        │             │
└──────────────────────────────────────┘        └─────────────┘
```

## 1 — Create a Turso database

```bash
# Install CLI once
curl -sSfL https://get.tur.so/install.sh | bash

turso auth signup          # or login if you already have an account
turso db create notenrechner
turso db show notenrechner --url            # → libsql://...turso.io
turso db tokens create notenrechner         # → auth token
```

Keep both values handy for the next step.

## 2 — Push the repo to GitHub

See the "Git migration" section in the main [README.md](README.md).

## 3 — Import into Vercel

1. Vercel dashboard → **New Project** → select your GitHub repo
2. Framework Preset: **Vite**
3. Build & Output settings: **use defaults** (`vercel.json` already configured)
4. Go to **Environment Variables** and add:

| Variable | Value | Notes |
|---|---|---|
| `JWT_SECRET` | (random 32+ chars — `openssl rand -hex 32`) | **REQUIRED** |
| `DB_URL` | `libsql://your-db.turso.io` | from step 1 |
| `DB_AUTH_TOKEN` | (the token from step 1) | **REQUIRED in prod** |
| `CORS_ORIGIN` | `https://your-vercel-domain.vercel.app` | comma-separate multiple |
| `INVITE_CODE` | (pick a long random string) | only people with this code can register |
| `TRUST_PROXY` | `true` | required so rate-limit sees real client IPs |

Deploy. Vercel builds `dist/` and makes the `api/index.ts` function available under `/api/*`.

## 4 — First-time setup

Hand your girlfriend the Vercel URL **and the invite code**. She registers once, logs in, adds students in the "Bibliothek" tab (name + klasse + stufe), then creates exams that pick from that library. All data lives in your Turso DB — same data on any device she logs in from.

Want to disable further signups entirely? Unset `INVITE_CODE` in Vercel; the registration endpoint returns 503.

## Anti-abuse protections that are already on

- **`@fastify/rate-limit`** — 120 req/min global per IP, 10 logins per 15 min, 5 registrations per 15 min; 3 violations → temp ban
- **`@fastify/helmet`** — X-Frame-Options, nosniff, HSTS, etc.
- **`vercel.json` headers** — CSP, Permissions-Policy, strict Referrer-Policy (defense-in-depth)
- **bcrypt cost 12** on passwords
- **Constant-time credentials compare** on login (timing-safe)
- **Invite code required** for registration (no public signup)
- **1 MB body limit** on every request
- **Parameterised SQL** via libSQL client — no injection
- **Per-user ownership checks** on every student/exam query
- **JWT 7-day lifetime** (was 30)

## Additional defense layers you can turn on

### Vercel WAF (available on Pro)
Dashboard → project → **Firewall** → enable managed rules, geo-blocking, custom rules (e.g. block known bad ASNs).

### Cloudflare in front (free tier, strong)
Transfer DNS to Cloudflare → proxy on → enable Bot Fight Mode + "Under Attack" mode on demand. This is by far the biggest single uplift vs. volumetric DDoS.

### Vercel env flag for emergencies
Set `INVITE_CODE=` (empty) in production env to block all new signups immediately, no redeploy needed.

## DDoS & botnet hijack — what's actually at risk?

A client-only app with a tiny Fastify backend offers almost no foothold for turning the host into a bot-node:

- **No shell execution**, no `eval`, no `child_process` in our code.
- **No file uploads** reaching the filesystem — only `POST /api/students/bulk` which accepts validated JSON.
- **CSV parser** is character-level, no regex on user input → no ReDoS surface.
- **XSS**: React escapes all text nodes; no `dangerouslySetInnerHTML` anywhere.
- **Vercel serverless isolation**: each invocation runs in an ephemeral container that cannot persist malware between calls even if compromised.

What remains:

| Threat | Mitigation |
|---|---|
| Credential stuffing | per-IP login rate limit (10/15min) + invite gate for accounts |
| Volumetric DDoS | Vercel's edge absorbs L7 floods automatically; Cloudflare in front is the nuclear option |
| Application-layer flood (valid-looking POSTs) | `@fastify/rate-limit` with `ban:3` + `CORS_ORIGIN` lockdown |
| Dependency supply chain | `npm audit` in CI, pin `package-lock.json`, renovate bot for timely updates |
| Leaked JWT secret | rotate `JWT_SECRET` — all existing tokens invalidate instantly |

## Quick checklist before going live

- [ ] `JWT_SECRET` set in Vercel (not the example value)
- [ ] `DB_URL` + `DB_AUTH_TOKEN` set
- [ ] `INVITE_CODE` set (or `ALLOW_OPEN_REGISTRATION=true` if you truly want open signup — don't)
- [ ] `CORS_ORIGIN` narrowed to the deployed domain(s)
- [ ] `TRUST_PROXY=true` so rate-limit keys by client IP, not Vercel's loopback
- [ ] Vercel domain custom-configured (optional)
- [ ] Test register → login → logout → re-login flow
