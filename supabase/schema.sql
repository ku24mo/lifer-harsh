-- Daily Rhythm schema for Harsh
-- Single-user app behind a passcode gate. RLS kept simple (enabled, service role bypasses).
-- Date keys are local YYYY-MM-DD strings (NOT timestamptz) to avoid tz rollover issues.

create table if not exists public.days (
  date text primary key,                       -- YYYY-MM-DD (local)
  quote text,                                  -- morning one-liner
  journal_answers jsonb,                       -- guided evening prompt answers
  journal_free text,                           -- free-form journal text
  energy int,                                  -- 1..5 optional
  steps int,                                   -- daily step count
  screen_time_min int,                         -- daily screen time in minutes
  sleep_hours numeric(4,1),                    -- hours slept (e.g. 7.5)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add health columns to existing days table if they don't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'days' and column_name = 'steps') then
    alter table public.days add column steps int;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'days' and column_name = 'screen_time_min') then
    alter table public.days add column screen_time_min int;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'days' and column_name = 'sleep_hours') then
    alter table public.days add column sleep_hours numeric(4,1);
  end if;
end $$;

create table if not exists public.block_completions (
  id uuid primary key default gen_random_uuid(),
  date text not null references public.days(date) on delete cascade,
  block_key text not null,
  intention text,
  outcome text,
  completed boolean not null default false,
  completed_at timestamptz,
  timer_seconds int not null default 0,        -- actual elapsed focus seconds
  timer_running boolean not null default false,
  timer_started_at timestamptz,                -- when current run started
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (date, block_key)
);

create table if not exists public.weekly_reviews (
  week_start text primary key,                 -- Monday YYYY-MM-DD
  wins text,
  slips text,
  next_week_focus text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sticky_notes (
  id uuid primary key default gen_random_uuid(),
  date text not null references public.days(date) on delete cascade,
  content text not null,
  color text not null default 'acid',   -- acid | black | yellow | white
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sticky_notes_date on public.sticky_notes(date);

-- Auto-updated_at triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_days_updated on public.days;
create trigger trg_days_updated before update on public.days
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_block_completions_updated on public.block_completions;
create trigger trg_block_completions_updated before update on public.block_completions
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_weekly_reviews_updated on public.weekly_reviews;
create trigger trg_weekly_reviews_updated before update on public.weekly_reviews
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_sticky_notes_updated on public.sticky_notes;
create trigger trg_sticky_notes_updated before update on public.sticky_notes
  for each row execute function public.touch_updated_at();

-- Row Level Security: the app uses the service role key for all writes from the
-- server, and the anon key is not exposed publicly (passcode gate sits in front).
-- RLS is enabled but permissive for authenticated/service roles.
alter table public.days enable row level security;
alter table public.block_completions enable row level security;
alter table public.weekly_reviews enable row level security;
alter table public.sticky_notes enable row level security;

-- Allow all for anon + authenticated (the passcode gate is the real boundary).
-- Tighten later if you ever expose the anon key publicly.
create policy "all days" on public.days for all using (true) with check (true);
create policy "all blocks" on public.block_completions for all using (true) with check (true);
create policy "all reviews" on public.weekly_reviews for all using (true) with check (true);
create policy "all sticky_notes" on public.sticky_notes for all using (true) with check (true);
