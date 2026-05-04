# Arutala

> A privacy-first menstrual-cycle tracker built for couples.

Arutala is an installable mobile-first web app (PWA) that tracks menstrual
cycles, daily symptoms, and moods, and shares the relevant context with a
linked partner. It is bilingual (Bahasa Indonesia / English), works offline,
and treats sensitive fields (like sexual activity) with end-to-end encryption.

This repository is a public release of the project. The original instance was
built as a personal project for two users; the code is published so that other
developers can study, fork, or self-host their own version.

## Highlights

- **Cycle tracking with science-backed predictions**. Period start/end logging,
  fertile-window estimation that follows ACOG Committee Opinion 651 (`+/- 14`
  luteal-phase rule), with adaptive averaging across the user's history.
- **Daily insights catalog**. 375 curated entries across 5 cycle phases
  covering physiology facts, evidence-based tips, cultural trivia, and
  lifestyle suggestions. Deterministic per-user-per-day selection.
- **Partner mode**. Two accounts can link into a couple. Each partner gets a
  scoped view of the other's cycle and daily logs (gated by Row Level Security
  policies).
- **Offline-first PWA**. Workbox-powered service worker, install prompt,
  notification scaffolding via Web Push + VAPID.
- **End-to-end encryption** for sensitive fields. PBKDF2 (600k iterations) +
  AES-GCM-256 via the Web Crypto API. No external crypto dependencies.
- **Indonesian UU PDP / GDPR posture**. Explicit consent flow, consent log,
  data export (CSV), account deletion, age gate (18+), MFA (TOTP), HIBP
  password breach check, optional Cloudflare Turnstile captcha.

## Tech stack

| Layer        | Choice                                                       |
| ------------ | ------------------------------------------------------------ |
| Framework    | React 19 + TypeScript (strict) on Vite 6                     |
| Styling      | Tailwind CSS v4, shadcn/ui (new-york), Motion for animation  |
| State        | TanStack Query v5 (server) + Zustand (UI)                    |
| Forms        | react-hook-form + zod                                        |
| Calendar     | react-day-picker v9 + date-fns                               |
| Charts       | Recharts (lazy-loaded)                                       |
| Backend      | Supabase (Postgres + Auth + Realtime + RLS + Edge Functions) |
| Push         | Web Push + VAPID + Supabase Edge Function + pg_cron          |
| Crypto       | Web Crypto API (zero dependency)                             |
| Hosting      | Cloudflare Pages                                             |
| Package mgr  | pnpm                                                         |

Initial JavaScript on first load is around 140 KB gzipped after route-level
code splitting and vendor chunking; heavy modules (Recharts, crypto, Settings)
load on demand.

## Repository layout

```
src/
  components/         shadcn primitives + shared layout
  features/           feature modules (auth, cycles, daily-logs, partners, ...)
    <feature>/
      components/
      hooks/
      api/            Supabase queries / mutations
      types/
  lib/                supabase client, crypto, i18n, date utils
  stores/             Zustand stores
  pages/              route components (lazy-loaded by router)
  router.tsx
  main.tsx
  globals.css

supabase/
  migrations/         numbered SQL migrations (apply in order)
  functions/          Edge Functions (push notifications)

scripts/              one-off Node / PowerShell helpers
public/               static assets, PWA icons, manifest
```

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Supabase project (free tier works). Optional: a Cloudflare Pages account
  to host the build, and a Cloudflare Turnstile site for captcha.

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/arutala.git
cd arutala
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# then edit .env.local with your Supabase project URL + anon key
```

`.env.example` lists every supported variable with comments.

### 3. Apply the database schema

The schema lives in `supabase/migrations/`. Apply each migration to your
Supabase project in order. The recommended path is the Supabase Management
API; the `pnpm db:push` script wires up the same flow if you have a Personal
Access Token in `.env.local`.

You can also paste the migrations into the Supabase Dashboard SQL editor in
filename order if you prefer a manual approach.

### 4. Run locally

```bash
pnpm dev          # Vite dev server on http://localhost:5173
pnpm typecheck    # TypeScript strict mode check
pnpm lint         # ESLint
pnpm test         # Vitest
pnpm build        # production bundle
```

### 5. Deploy

The app is built to deploy on Cloudflare Pages out of the box: connect your
Git fork, set the same `.env` variables in the Pages dashboard, and use
`pnpm build` as the build command (output `dist/`). It is otherwise a plain
SPA and will work on any static host.

## Internationalization

The app ships with Indonesian (default) and English. Strings live in
`src/lib/i18n.ts`, which is a tiny zero-dependency hook backed by a Zustand
store. Add a key to both catalogs, then call `t('your.key')` from any
component.

## Privacy and security

The data-controller identity shown on the in-app `/privacy` page is sourced
from `VITE_DATA_CONTROLLER_NAME`, `VITE_DATA_CONTROLLER_EMAIL`, and
`VITE_PRIVACY_NOTICE_URL`. **You must set these before going to production**
so that your users know who is processing their data. See `SECURITY.md` for
how to report security issues.

The end-to-end encryption module (`src/lib/crypto.ts`) is small and audited
for the field-level use case. If you adapt it for other purposes, please
re-evaluate the threat model.

## Contributing

This is primarily a personal project, so feature contributions are not
actively solicited. Bug reports, security disclosures, and small fixes are
welcome via GitHub issues / pull requests. Please open an issue before
starting on a larger change so we can discuss scope.

## License

MIT — see [LICENSE](LICENSE).
