"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { blocksForDay } from "@/lib/rhythm";
import { cn, dateKey, parseDateKey, addDays } from "@/lib/utils";
import { fetchRangeBundle, fetchStickyNotesRange } from "@/lib/data-client";
import { completionPctForDate } from "@/lib/completion";
import { ManifestoTicker } from "./ManifestoTicker";
import type { BlockCompletionRow, DayRow, StickyNoteRow } from "@/lib/types";

interface Props {
  weekStart: string;
  bundle: Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }>;
  stickyNotes: StickyNoteRow[];
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekView({ weekStart: initial, bundle: initialBundle, stickyNotes: initialNotes }: Props) {
  const [weekStart, setWeekStart] = useState(initial);
  const [bundle, setBundle] =
    useState<Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }>>(initialBundle);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteRow[]>(initialNotes);

  const start = parseDateKey(weekStart);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(start, i)),
    [start]
  );

  const load = useCallback(async (ws: string) => {
    const end = dateKey(addDays(parseDateKey(ws), 6));
    const [b, notes] = await Promise.all([
      fetchRangeBundle(ws, end),
      fetchStickyNotesRange(ws, end),
    ]);
    setBundle(b);
    setStickyNotes(notes);
  }, []);

  useEffect(() => {
    if (weekStart !== initial) load(weekStart);
  }, [weekStart, initial, load]);

  const go = (delta: number) =>
    setWeekStart(dateKey(addDays(parseDateKey(weekStart), delta * 7)));

  const todayKey = dateKey(new Date());
  const weekPcts = days.map((d) => {
    const k = dateKey(d);
    const entry = bundle[k];
    return entry ? completionPctForDate(k, entry.blocks) : 0;
  });
  const avgPct = Math.round(weekPcts.reduce((a, b) => a + b, 0) / (weekPcts.length || 1));

  return (
    <div className="relative">
      <ManifestoTicker variant="fullwidth" />
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-8 sm:py-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/40">
            week view
          </div>
          <h2 className="mt-1 text-[36px] font-bold tracking-tighter leading-[0.9] text-black">
            {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h2>
          <p className="mt-1 text-[12px] text-black/40">{avgPct}% avg</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => go(-1)}
            className="flex h-9 w-9 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            className="flex h-9 w-9 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-8 border-t-2 border-black">
        {days.map((d, i) => {
          const k = dateKey(d);
          const entry = bundle[k];
          const pct = entry ? completionPctForDate(k, entry.blocks) : 0;
          const isToday = k === todayKey;
          const isFuture = k > todayKey;
          const applicable = blocksForDay(d.getDay());
          const completedCount = entry
            ? applicable.filter((b) =>
                entry.blocks.some((bc) => bc.block_key === b.key && bc.completed)
              ).length
            : 0;
          const hasJournal =
            entry?.day?.journal_answers || entry?.day?.journal_free || entry?.day?.energy != null;
          const quote = entry?.day?.quote;
          const dayNotes = stickyNotes.filter((n) => n.date === k);

          return (
            <Link
              key={k}
              href={`/?date=${k}`}
              className={cn(
                "flex items-center gap-4 py-4 border-b border-black/10 transition hover:bg-[var(--acid)]/10 -mx-5 px-5 sm:-mx-8 sm:px-8",
                isToday && "bg-[var(--acid)]/20"
              )}
            >
              <div className="w-14 shrink-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-black/40">
                  {WEEKDAYS[i]}
                </div>
                <div className="text-[24px] font-bold tabular-nums leading-none text-black">
                  {d.getDate()}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-[20px] font-bold tabular-nums leading-none",
                      isFuture ? "text-black/20" : "text-black"
                    )}
                  >
                    {isFuture ? "—" : `${pct}%`}
                  </span>
                  {isToday && (
                    <span className="bg-[var(--acid)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-black">
                      today
                    </span>
                  )}
                  {hasJournal && (
                    <span className="text-[10px] font-bold uppercase text-black/40">journal</span>
                  )}
                </div>
                <div className="mt-2 h-1.5 w-full bg-black/10">
                  <div
                    className={cn(
                      "h-full transition-all",
                      pct === 100 ? "bg-black" : "bg-[var(--acid)]"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-black/40">
                  {isFuture ? "upcoming" : `${completedCount}/${applicable.length} blocks`}
                  {quote && <span className="ml-2 italic">“{quote}”</span>}
                </div>
                {dayNotes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dayNotes.slice(0, 3).map((note) => (
                      <div
                        key={note.id}
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium leading-tight border border-black/20",
                          note.color === "acid" && "bg-[var(--acid)] text-black",
                          note.color === "pink" && "bg-pink-400 text-black",
                          note.color === "blue" && "bg-sky-400 text-black",
                          note.color === "yellow" && "bg-yellow-300 text-black",
                          note.color === "black" && "bg-black text-white"
                        )}
                      >
                        {note.pinned && <span className="shrink-0">★</span>}
                        <span className="truncate">
                          {note.content.length > 40
                            ? note.content.slice(0, 40) + "…"
                            : note.content}
                        </span>
                      </div>
                    ))}
                    {dayNotes.length > 3 && (
                      <span className="text-[8px] font-bold uppercase tracking-wider text-black/30">
                        +{dayNotes.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      </div>
    </div>
  );
}
