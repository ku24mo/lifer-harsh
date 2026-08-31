# Daily Rhythm — Harsh's Personal Life Dashboard

A polished, mobile-first PWA life dashboard. Tracks a fixed daily rhythm with
per-block countdown timers, a guided evening journal, a morning one-liner quote,
weekly reviews, and day/week/month/year progress heatmaps to spot slacking.

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind v4
- Supabase Postgres (storage)
- Single-passcode auth (httpOnly cookie)
- PWA (installable, offline shell)
- Deployed on Vercel

## Setup

### 1. Supabase
1. Create a project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL editor
3. Copy the project URL, anon key, and service role key

### 2. Environment
Copy `.env.example` to `.env.local` and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PASSCODE_HASH=...
```
Generate the passcode hash:
```bash
node -e "console.log(require('crypto').createHash('sha256').update('yourpass').digest('hex'))"
```

### 3. Run
```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
```

### 4. Deploy to Vercel
- Import the repo at https://vercel.com/new
- Add the same env vars in Project Settings → Environment Variables
- Deploy

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — eslint

## Architecture
- `src/lib/rhythm.ts` — fixed daily schedule config (the source of truth for blocks)
- `src/lib/data.ts` — server actions (Supabase reads/writes, service role)
- `src/lib/data-client.ts` — client-side Supabase reads (range fetches for nav)
- `src/lib/completion.ts` — pure completion % calc (shared client/server)
- `src/lib/auth.ts` — passcode hash/verify + session cookie (Node runtime)
- `src/lib/auth-constants.ts` — cookie name (Edge-safe, imported by middleware)
- `middleware.ts` — passcode gate (Edge runtime)
- `src/components/*` — UI components (DayView, WeekView, MonthView, YearView, ReviewView, CountdownTimer, JournalModal, Heatmap, etc.)
- `supabase/schema.sql` — DB schema

## Key design notes
- **Timezone:** dates are stored as local `YYYY-MM-DD` strings, NOT UTC timestamptz, so 6:30am doesn't roll over wrong.
- **Gym block** auto-hides on Sat/Sun and is NOT counted as missed in completion %.
- **Timer state** persists to Supabase (`timer_seconds`, `timer_running`, `timer_started_at`) so a mobile reload mid-block resumes correctly.
- **Slacking detection:** end-of-day, unticked blocks = missed (computed on read for heatmaps; no live nagging).
- **Single-user:** RLS is permissive; the passcode gate is the real boundary. Tighten if you ever share.
