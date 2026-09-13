# Changelog

User-visible changes to Arutala. Internal milestone notes live separately;
this file focuses on what shipped.

## Unreleased

### Fixes

- Solo accounts now get an automatic household so period start/end and daily
  logs work without linking a partner. Invitation / unlink keep that data.
- Auth bootstrap no longer hangs if `getSession()` fails. Supabase client
  accepts `sb_publishable_...` keys. Render errors show a Chinese recovery
  screen instead of a blank page.
- API and auth failures display Simplified Chinese instead of English or
  leftover Indonesian RPC text.

### Style

- Light default theme with a warm blush / rose palette. Dark mode is cocoa-rose
  rather than icy purple. PWA theme color and logo gradient match.

### Auth / onboarding

- Signup is username + password only. Birth date / age gate, consent checkboxes,
  and Have I Been Pwned checks no longer block registration.
- First-run role and couple prompts are skipped; new accounts default to solo
  tracker. Display name and avatar remain optional in Settings.

### Performance

- Initial JavaScript bundle reduced from ~467 KB gzipped to ~140 KB by
  lazy-loading every route component and splitting vendor code (React,
  Supabase, TanStack Query, Recharts, Motion, react-hook-form, date-fns)
  into separate chunks. Heavy pages (Settings, Insights with Recharts) now
  load on demand.

### Privacy

- The data-controller identity displayed on the in-app `/privacy` page is
  now configurable via `VITE_DATA_CONTROLLER_NAME`, `VITE_DATA_CONTROLLER_EMAIL`,
  and `VITE_PRIVACY_NOTICE_URL`. Forks must set these before production.
- The consent-form copy no longer hardcodes a controller name; users are
  pointed to the Privacy page for the controller identity instead.

### Content

- Daily insights catalog rewritten end-to-end: 375 entries across 5 cycle
  phases, distributed as facts (30) + tips (25) + trivia (8) + lifestyle (12)
  per phase. Each entry is grounded in specific physiological detail or an
  actionable recommendation; vague "support" entries were removed entirely.
- Indonesian copy across the app moved to a more formal, warmer voice,
  removed slang ("lo" -> "Kamu"), trimmed em-dashes, and reduced incidental
  emoji use.

## Previous milestones

The pre-release feature set includes:

- Authentication, couple linking, and partner-aware Row Level Security
- Period start/end logging, calendar view, fertile-window prediction
  following ACOG Committee Opinion 651 (`+/- 14` luteal-phase rule)
- Daily logging of symptoms, moods, flow, and notes with realtime sync
- Cycle wheel home screen, charts, and a 4-tab bottom navigation
- Progressive Web App (offline service worker, installable, push-ready)
- End-to-end encryption for sensitive fields (PBKDF2 600k + AES-GCM-256
  via the Web Crypto API, zero dependencies)
- UU PDP / GDPR posture: explicit consent flow, consent log, data export,
  account deletion, 18+ age gate, MFA (TOTP), HIBP breach check, optional
  Cloudflare Turnstile captcha
