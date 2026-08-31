"use server";

import { createServiceClient } from "@/lib/supabase-server";
import { dateKey as makeDateKey, parseDateKey } from "@/lib/utils";
import type {
  DayRow,
  BlockCompletionRow,
  WeeklyReviewRow,
  StickyNoteRow,
} from "@/lib/types";

async function db() {
  return createServiceClient();
}

/** Ensure a days row exists for a given date key. */
export async function ensureDay(date: string): Promise<DayRow> {
  const supabase = await db();
  const { data: existing } = await supabase
    .from("days")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (existing) return existing as DayRow;

  const { data, error } = await supabase
    .from("days")
    .insert({ date })
    .select("*")
    .single();
  if (error) throw error;
  return data as DayRow;
}

export async function getDay(date: string): Promise<DayRow | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("days")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  return (data as DayRow) ?? null;
}

export async function getBlocksForDate(
  date: string
): Promise<BlockCompletionRow[]> {
  const supabase = await db();
  const { data } = await supabase
    .from("block_completions")
    .select("*")
    .eq("date", date);
  return (data as BlockCompletionRow[]) ?? [];
}

export async function getDayBundle(date: string) {
  const [day, blocks] = await Promise.all([
    getDay(date),
    getBlocksForDate(date),
  ]);
  return { day, blocks };
}

/** Fetch day bundles for a range of date keys (inclusive). */
export async function getDayBundleRange(
  startDate: string,
  endDate: string
): Promise<Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }>> {
  const supabase = await db();
  const [daysRes, blocksRes] = await Promise.all([
    supabase.from("days").select("*").gte("date", startDate).lte("date", endDate),
    supabase
      .from("block_completions")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate),
  ]);
  const days = (daysRes.data as DayRow[]) ?? [];
  const blocks = (blocksRes.data as BlockCompletionRow[]) ?? [];
  const map: Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }> = {};
  // Initialize all dates in range
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const k = makeDateKey(d);
    map[k] = { day: null, blocks: [] };
  }
  for (const day of days) map[day.date] = { day, blocks: map[day.date]?.blocks ?? [] };
  for (const b of blocks) {
    if (!map[b.date]) map[b.date] = { day: null, blocks: [] };
    map[b.date].blocks.push(b);
  }
  return map;
}

export async function saveQuote(date: string, quote: string) {
  await ensureDay(date);
  const supabase = await db();
  const { error } = await supabase
    .from("days")
    .update({ quote, updated_at: new Date().toISOString() })
    .eq("date", date);
  if (error) throw error;
}

/** Fetch all days that have journal entries, ordered newest first. */
export async function getJournalEntries(): Promise<DayRow[]> {
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("days")
      .select("*")
      .not("journal_free", "is", null)
      .order("date", { ascending: false });
    return (data as DayRow[]) ?? [];
  } catch {
    return [];
  }
}

export async function saveJournal(
  date: string,
  answers: Record<string, string>,
  free: string,
  energy: number | null
) {
  await ensureDay(date);
  const supabase = await db();
  const { error } = await supabase
    .from("days")
    .update({
      journal_answers: answers,
      journal_free: free,
      energy,
      updated_at: new Date().toISOString(),
    })
    .eq("date", date);
  if (error) throw error;
}

export async function toggleBlockComplete(
  date: string,
  blockKey: string,
  completed: boolean
) {
  await ensureDay(date);
  const supabase = await db();
  const completed_at = completed ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("block_completions")
    .upsert(
      {
        date,
        block_key: blockKey,
        completed,
        completed_at,
        timer_running: completed ? false : undefined,
      },
      { onConflict: "date,block_key" }
    );
  if (error) throw error;
}

export async function saveBlockNotes(
  date: string,
  blockKey: string,
  intention: string,
  outcome: string
) {
  await ensureDay(date);
  const supabase = await db();
  const { error } = await supabase
    .from("block_completions")
    .upsert(
      { date, block_key: blockKey, intention, outcome },
      { onConflict: "date,block_key" }
    );
  if (error) throw error;
}

export async function saveTimerState(
  date: string,
  blockKey: string,
  state: {
    timer_seconds: number;
    timer_running: boolean;
    timer_started_at: string | null;
  }
) {
  await ensureDay(date);
  const supabase = await db();
  const { error } = await supabase
    .from("block_completions")
    .upsert(
      {
        date,
        block_key: blockKey,
        timer_seconds: state.timer_seconds,
        timer_running: state.timer_running,
        timer_started_at: state.timer_started_at,
      },
      { onConflict: "date,block_key" }
    );
  if (error) throw error;
}

export async function getWeeklyReview(
  weekStart: string
): Promise<WeeklyReviewRow | null> {
  const supabase = await db();
  const { data } = await supabase
    .from("weekly_reviews")
    .select("*")
    .eq("week_start", weekStart)
    .maybeSingle();
  return (data as WeeklyReviewRow) ?? null;
}

export async function saveWeeklyReview(
  weekStart: string,
  wins: string,
  slips: string,
  nextWeekFocus: string
) {
  const supabase = await db();
  const { error } = await supabase
    .from("weekly_reviews")
    .upsert(
      { week_start: weekStart, wins, slips, next_week_focus: nextWeekFocus },
      { onConflict: "week_start" }
    );
  if (error) throw error;
}

// ── Sticky Notes ──────────────────────────────────────────

export async function getStickyNotes(date: string): Promise<StickyNoteRow[]> {
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("sticky_notes")
      .select("*")
      .eq("date", date)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: true });
    return (data as StickyNoteRow[]) ?? [];
  } catch {
    return [];
  }
}

export async function getStickyNotesRange(
  startDate: string,
  endDate: string
): Promise<StickyNoteRow[]> {
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("sticky_notes")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("created_at", { ascending: true });
    return (data as StickyNoteRow[]) ?? [];
  } catch {
    return [];
  }
}

export async function addStickyNote(
  date: string,
  content: string,
  color: string = "acid"
) {
  await ensureDay(date);
  const supabase = await db();
  const { error } = await supabase
    .from("sticky_notes")
    .insert({ date, content, color });
  if (error) throw error;
}

export async function updateStickyNote(
  id: string,
  content: string,
  color: string
) {
  const supabase = await db();
  const { error } = await supabase
    .from("sticky_notes")
    .update({ content, color })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteStickyNote(id: string) {
  const supabase = await db();
  const { error } = await supabase
    .from("sticky_notes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function toggleStickyNotePin(id: string, pinned: boolean) {
  const supabase = await db();
  const { error } = await supabase
    .from("sticky_notes")
    .update({ pinned })
    .eq("id", id);
  if (error) throw error;
}

