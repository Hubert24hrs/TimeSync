# TimeSync

Scheduling for globally distributed teams: fair meeting times across time zones, Calendly-style booking links, group polls and round-robin — built with Expo (iOS, Android, web), Expo Router, TypeScript and Reanimated, on a Supabase backend.

The app runs **without a backend** in demo mode (everything on-device with a realistic 9-person global team), and switches to Supabase when you add credentials.

## What's in the box

**Scheduling engine** (`src/engine`, pure TypeScript, shared by the app, tests and Edge Functions)
- **Meeting optimizer** — scores every candidate slot per participant (working hours → stretch → unsocial → night, plus regional weekends and public holidays) and gives each slot a **fairness score**: mean burden, the worst-off person, and how much the slot widens accumulated inconvenience (so late calls rotate instead of always landing on the same person).
- **Chronotype energy** — lion / bear / wolf / dolphin curves; slots are ranked by team energy (Pro).
- **Availability engine** — weekly hours, date overrides, multiple schedules, buffers, minimum notice, daily caps, rolling window; 1:1, group seats, collective (all hosts free) and load-balanced round-robin. Fully DST-aware via Luxon (spring-forward gaps, fall-back repeats, southern hemisphere, half-hour zones).
- **Cultural calendar** — holidays/observances for 2026–2027 (lunar dates flagged as approximate) and regional workweeks (e.g. Sun–Thu in IL/SA/EG…).
- Polls (tally, winner, heatmap), routing forms, RFC 5545 `.ics` export, HMAC-signed manage links, reminder planning, analytics, zod validation, and a deterministic scheduling assistant.

**App** (`app/`, `src/`)
- Tabs: **Today** (bento dashboard), **Schedule** (bookings, event types, polls), **Team** (live day/night globe, overlap heatmap, DST-aware clocks), **Assistant** (chat + insights), **Profile**. Floating **New meeting** button; side rail + bento columns on tablet/web.
- Dark-first theme with light/system modes, glass cards, gradient accents, Space Grotesk / Inter / JetBrains Mono, Reanimated transitions, haptics, skeleton loaders, accessibility labels/roles.
- 3-step onboarding (zone auto-detect + country/workweek + hours → chronotype → booking link).
- Event-type editor (durations, buffers, notice, caps, locations, intake questions, colors), availability editor (multiple schedules, date overrides), optimizer → invite (.ics) or poll, poll voting + close & book, analytics, cultural calendar, routing-form tester, integrations (calendars, Slack, webhooks, embed widget, QR), paywall, referrals, settings.
- **Public booking page** `/<user>/<event>` (no login): slots in the invitee's auto-detected zone with fairness ⚖ and energy ⚡ badges, intake questions, bot honeypot, confirmation with `.ics`; **manage page** `/booking/<id>?token=…` to reschedule or cancel.
- Monetization kept: plans + `FeatureGate`, house ad for consenting free users, GDPR consent (all optional categories off by default), referrals.

**Backend** (`supabase/`)
- `migrations/20261029000000_init.sql` — schema with **RLS on every table**; OAuth tokens and rate-limit tables are service-role only; a Postgres exclusion constraint makes double-booking impossible even under races; the Free-plan event-type cap is enforced in the database; users can't change their own tier.
- Edge Functions (Deno):
  | Function | Auth | Purpose |
  |---|---|---|
  | `public-booking` | public, per-IP rate limit | slots with badges; validated booking; picks round-robin host; writes calendars; reminders; emails; webhooks |
  | `manage-booking` | signed token | view / `.ics` / reschedule / cancel |
  | `ai-chat` | user JWT, burst + daily limits | assistant grounded in the user's real data; Claude only for Pro/Team **and** only if `ANTHROPIC_API_KEY` is set, otherwise the engine answers |
  | `calendar-sync` | user JWT, Pro | Google / Outlook OAuth code exchange, busy-time sync, disconnect |
  | `send-reminders` | `x-cron-secret` | due email/push reminders, follow-ups, marks meetings completed, refreshes busy time |
  | `slack-command` | Slack signature | `/timesync today · find · links · link <code>` (Team plan) |
  | `close-poll` | user JWT | picks the winner and books it on the owner's calendar |

## Plans

| | Free | Pro | Team |
|---|---|---|---|
| Event types | 1 active | Unlimited | Unlimited |
| Optimizer | Fairness | + energy ranking (chronotypes) | same |
| Calendar sync, analytics, AI model, webhooks, cultural calendar, ad-free | – | ✓ | ✓ |
| Round-robin & collective, routing forms, Slack | – | – | ✓ |

## Getting started

```bash
npm install
```

```bash
npm start
```

Choose **Explore with demo data**. Useful scripts:

| Script | What it does |
|---|---|
| `npm run typecheck` | app typecheck (`tsc --noEmit`) |
| `npm run typecheck:functions` | Edge Functions typecheck (Deno globals shimmed) |
| `npm run lint` | `expo lint` |
| `npm test` | Jest: optimizer, DST edge cases, availability engine, hosts, polls, routing, ics, signed links, reminders, analytics, validation, assistant |
| `npm run export:web` then `npm run serve:web` | static web build + local SPA server on :8082 (deep links like `/alex/intro-call` work) |

Builds: `npx expo export --platform ios --platform android` bundles the native JS; store binaries use EAS (`eas.json` has development / preview / production profiles — EAS is a hosted service; you can also run `npx expo run:ios` / `run:android` locally with Xcode / Android Studio).

## Connecting Supabase

1. Create a Supabase project, then link and push the schema:
   ```bash
   supabase link --project-ref <ref>
   ```
   ```bash
   supabase db push
   ```
2. Enable **Google** and **Apple** providers in Auth; add `timesync://auth-callback` and your web origin to redirect URLs.
3. Copy `supabase/.env.example` → `supabase/.env`, fill it (at least `LINK_SIGNING_SECRET`, `PUBLIC_ORIGIN`, `CRON_SECRET`), then:
   ```bash
   supabase secrets set --env-file supabase/.env
   ```
   ```bash
   supabase functions deploy
   ```
   The functions import the shared engine from `src/engine` via relative paths; `supabase/functions/deno.json` maps `luxon`, `zod`, `@supabase/supabase-js` and `@anthropic-ai/sdk`.
4. Schedule `send-reminders` every 5 minutes (Supabase Scheduled Functions or `pg_cron` + `pg_net`) with header `x-cron-secret: <CRON_SECRET>`.
5. Copy `.env.example` → `.env` and set `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_BOOKING_ORIGIN` (and the public Google/Microsoft client ids for calendar connect).
6. Host the web build at your booking origin with SPA fallback (every unknown path → `index.html`).

**Calendar sync:** create a Google OAuth web client (Calendar API) and an Azure app registration (`Calendars.ReadWrite`, `offline_access`); set the redirect URI to `<web origin>/integrations`. The consent round-trip finishes on the web app; secrets and tokens stay server-side.

## Security notes

- No AI provider or other secret ever ships in the app: only `EXPO_PUBLIC_*` values are bundled; the anon key is protected by RLS.
- All inputs are validated with the same zod schemas client- and server-side; public endpoints are rate-limited per hashed IP; booking forms include a honeypot.
- Emailed manage links are HMAC-SHA256 signed with expiry; webhooks carry `X-TimeSync-Signature: sha256=HMAC(secret, "<timestamp>.<body>")`; Slack requests are signature-checked.
- `.env` files are git-ignored (examples are committed).

## Project layout

```
app/                 Expo Router screens (tabs, modals, public booking + manage pages)
src/engine/          pure scheduling engine + tests (shared with Edge Functions)
src/data/            demo dataset and the data API (demo ↔ Supabase)
src/components/      domain components (globe, clocks, energy, cards, chat, share link…)
src/ui/              design-system primitives (Screen, Card, Button, Chip, Skeleton…)
src/store/           Redux Toolkit slices + redux-persist (UI state & offline cache)
src/lib/             config, Supabase client, auth, haptics, files, push, calendar connect
supabase/            migrations, Edge Functions, config
```

## Not done yet

- **Payments**: the paywall simulates upgrades in demo mode only; no App Store / Play / Stripe purchase flow, so cloud plans are set server-side (`profiles.tier`).
- **Email provider and AI provider** are optional, paid services and are off until you add `RESEND_API_KEY` / `ANTHROPIC_API_KEY` (emails are logged otherwise; the assistant falls back to the engine).
- **Zoom auto-links** (Zoom OAuth) — Zoom events use the host's static link; Meet/Teams links are generated via calendar sync.
- **Team management UI** (invites, roles) and **routing-form builder** — tables, RLS and the runtime exist; forms are read/tested in the app.
- **Guest poll voting** (non-members) and server-side **referral attribution**.
- Calendar connect on iOS/Android hands off to the web app to finish OAuth.
- Edge Functions are type-checked with `tsc` but have not been run against a live Supabase project in this repo; native binaries have not been built (JS bundles for iOS/Android export cleanly).
