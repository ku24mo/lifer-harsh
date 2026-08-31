"use client";

import { createClient } from "@/lib/supabase-client";
import type { DayRow, BlockCompletionRow, StickyNoteRow } from "@/lib/types";

export async function fetchDayBundle(
  date: string
): Promise<{ day: DayRow | null; blocks: BlockCompletionRow[] }> {
  try {
    const supabase = createClient();
    const [dayRes, blocksRes] = await Promise.all([
      supabase.from("days").select("*").eq("date", date).maybeSingle(),
      supabase.from("block_completions").select("*").eq("date", date),
    ]);
    return {
      day: (dayRes.data as DayRow) ?? null,
      blocks: (blocksRes.data as BlockCompletionRow[]) ?? [],
    };
  } catch {
    return { day: null, blocks: [] };
  }
}

export async function fetchRangeBundle(
  startDate: string,
  endDate: string
): Promise<Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }>> {
  try {
    const supabase = createClient();
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
    const [sy, sm, sd] = startDate.split("-").map(Number);
    const [ey, em, ed] = endDate.split("-").map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      map[`${y}-${m}-${day}`] = { day: null, blocks: [] };
    }
    for (const day of days) map[day.date] = { day, blocks: map[day.date]?.blocks ?? [] };
    for (const b of blocks) {
      if (!map[b.date]) map[b.date] = { day: null, blocks: [] };
      map[b.date].blocks.push(b);
    }
    return map;
  } catch {
    return {};
  }
}

export async function fetchStickyNotes(
  date: string
): Promise<StickyNoteRow[]> {
  try {
    const supabase = createClient();
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

export async function fetchStickyNotesRange(
  startDate: string,
  endDate: string
): Promise<StickyNoteRow[]> {
  try {
    const supabase = createClient();
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

export async function fetchGymCompletions(
  date: string
): Promise<Record<string, boolean>> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("gym_completions")
      .select("exercise_key, completed")
      .eq("date", date);
    const map: Record<string, boolean> = {};
    for (const row of (data ?? []) as { exercise_key: string; completed: boolean }[]) {
      map[row.exercise_key] = row.completed;
    }
    return map;
  } catch {
    return {};
  }
}

export async function toggleGymExerciseClient(
  date: string,
  exerciseKey: string,
  completed: boolean
): Promise<void> {
  try {
    const supabase = createClient();
    const completed_at = completed ? new Date().toISOString() : null;
    await supabase
      .from("gym_completions")
      .upsert(
        { date, exercise_key: exerciseKey, completed, completed_at },
        { onConflict: "date,exercise_key" }
      );
  } catch (e) {
    console.error("toggleGymExercise failed", e);
  }
}
