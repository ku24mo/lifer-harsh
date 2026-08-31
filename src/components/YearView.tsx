"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { YearHeatmap } from "./Heatmap";
import { ManifestoTicker } from "./ManifestoTicker";
import { fetchRangeBundle, fetchStickyNotesRange } from "@/lib/data-client";
import { completionPctForDate } from "@/lib/completion";
import { dateKey, parseDateKey } from "@/lib/utils";
import type { BlockCompletionRow, DayRow, StickyNoteRow } from "@/lib/types";

interface Props {
  year: number;
  bundle: Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }>;
  stickyNotes: StickyNoteRow[];
}

export function YearView({ year: initialYear, bundle: initialBundle, stickyNotes: initialNotes }: Props) {
  const [year, setYear] = useState(initialYear);
  const [bundle, setBundle] =
    useState<Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }>>(initialBundle);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteRow[]>(initialNotes);

  const todayKey = dateKey(new Date());

  const load = useCallback(async (y: number) => {
    const start = dateKey(new Date(y, 0, 1));
    const end = dateKey(new Date(y, 11, 31));
    const [b, notes] = await Promise.all([
      fetchRangeBundle(start, end),
      fetchStickyNotesRange(start, end),
    ]);
    setBundle(b);
    setStickyNotes(notes);
  }, []);

  useEffect(() => {
    if (year !== initialYear) load(year);
  }, [year, initialYear, load]);

  const pctMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [k, entry] of Object.entries(bundle)) {
      map[k] = completionPctForDate(k, entry.blocks);
    }
    return map;
  }, [bundle]);

  const yearPcts = Object.entries(pctMap).filter(([k]) => {
    const d = parseDateKey(k);
    return d.getFullYear() === year && k <= todayKey;
  });
  const perfectDays = yearPcts.filter(([, p]) => p === 100).length;
  const slackedDays = yearPcts.filter(([, p]) => p < 50).length;
  const avgPct = yearPcts.length
    ? Math.round(yearPcts.reduce((a, [, p]) => a + p, 0) / yearPcts.length)
    : 0;

  const notesByDate = useMemo(() => {
    const map: Record<string, StickyNoteRow[]> = {};
    for (const n of stickyNotes) {
      if (!map[n.date]) map[n.date] = [];
      map[n.date].push(n);
    }
    return map;
  }, [stickyNotes]);

  return (
    <div className="relative">
      <ManifestoTicker variant="fullwidth" />
      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-8 sm:py-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/40">
            year view
          </div>
          <h2 className="mt-1 text-[48px] font-bold tracking-tighter leading-[0.9] text-black">
            {year}
          </h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="flex h-9 w-9 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="flex h-9 w-9 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-6 border-t-2 border-black pt-4">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-black/40">perfect</div>
          <div className="text-[24px] font-bold tabular-nums leading-none">{perfectDays}</div>
        </div>
        <div className="border-l-2 border-black/10 pl-6">
          <div className="text-[9px] font-bold uppercase tracking-wider text-black/40">avg</div>
          <div className="text-[24px] font-bold tabular-nums leading-none">{avgPct}%</div>
        </div>
        <div className="border-l-2 border-black/10 pl-6">
          <div className="text-[9px] font-bold uppercase tracking-wider text-black/40">slacked</div>
          <div className="text-[24px] font-bold tabular-nums leading-none">{slackedDays}</div>
        </div>
      </div>

      <div className="mt-8 border-2 border-black p-4">
        <YearHeatmap
          year={year}
          data={pctMap}
          todayKey={todayKey}
          notesByDate={notesByDate}
        />
      </div>
      </div>
    </div>
  );
}
