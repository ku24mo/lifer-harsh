"use client";

import Link from "next/link";
import { cn, parseDateKey } from "@/lib/utils";
import type { StickyNoteRow } from "@/lib/types";

interface Props {
  data: Record<string, number>;
  todayKey: string;
}

/** Color class for a given completion percentage. */
export function heatColor(pct: number | undefined, isFuture: boolean): string {
  if (pct === undefined) return "bg-black/5";
  if (isFuture) return "bg-black/5";
  if (pct >= 100) return "bg-[var(--acid)]";
  if (pct >= 80) return "bg-[var(--acid-dim)]";
  if (pct >= 60) return "bg-black/40";
  if (pct >= 40) return "bg-black/30";
  if (pct >= 20) return "bg-black/20";
  if (pct > 0) return "bg-black/10";
  return "bg-black";
}

function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const NOTE_BG: Record<string, string> = {
  acid: "bg-[var(--acid)]",
  pink: "bg-pink-400",
  blue: "bg-sky-400",
  yellow: "bg-yellow-300",
  black: "bg-black",
};
const NOTE_TEXT: Record<string, string> = {
  acid: "text-black",
  pink: "text-black",
  blue: "text-black",
  yellow: "text-black",
  black: "text-white",
};

/** Month grid — big cells with note text visible. */
export function MonthHeatmap({
  year,
  month,
  data,
  todayKey,
  notesByDate,
}: {
  year: number;
  month: number;
  data: Record<string, number>;
  todayKey: string;
  notesByDate?: Record<string, StickyNoteRow[]>;
}) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstWeekday = first.getDay();
  const leadDays = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadDays; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">
        {monthName}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold uppercase text-black/30 pb-1">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[110px]" />;
          const k = dateKeyOf(d);
          const pct = data[k];
          const isFuture = k > todayKey;
          const isToday = k === todayKey;
          const dayNotes = notesByDate?.[k] ?? [];
          return (
            <Link
              key={i}
              href={`/?date=${k}`}
              className={cn(
                "relative min-h-[110px] border border-black/10 p-1.5 transition hover:ring-2 hover:ring-black flex flex-col",
                heatColor(pct, isFuture),
                isToday && "ring-2 ring-black"
              )}
              title={`${k}: ${pct === undefined ? "no data" : `${pct}%`}${dayNotes.length > 0 ? ` · ${dayNotes.length} note${dayNotes.length > 1 ? "s" : ""}` : ""}`}
            >
              {/* Day number */}
              <span className="text-[11px] font-bold tabular-nums text-black/60 self-end">
                {d.getDate()}
              </span>

              {/* Notes — show first few words */}
              {dayNotes.length > 0 && (
                <div className="mt-1 space-y-0.5 flex-1 overflow-hidden">
                  {dayNotes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className={cn(
                        "px-1 py-0.5 text-[9px] font-medium leading-tight border border-black/20 truncate",
                        NOTE_BG[note.color] ?? NOTE_BG.acid,
                        NOTE_TEXT[note.color] ?? NOTE_TEXT.acid
                      )}
                    >
                      {note.pinned && "★ "}
                      {note.content.slice(0, 24)}
                      {note.content.length > 24 ? "…" : ""}
                    </div>
                  ))}
                  {dayNotes.length > 3 && (
                    <span className="text-[7px] font-bold uppercase text-black/40">
                      +{dayNotes.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Year heatmap — portrait layout: 12 months stacked vertically, each as a horizontal strip. */
export function YearHeatmap({
  year,
  data,
  todayKey,
  notesByDate,
}: {
  year: number;
  data: Record<string, number>;
  todayKey: string;
  notesByDate?: Record<string, StickyNoteRow[]>;
}) {
  const months = Array.from({ length: 12 }, (_, m) => m);

  return (
    <div className="space-y-4">
      {months.map((month) => {
        const first = new Date(year, month, 1);
        const last = new Date(year, month + 1, 0);
        const firstWeekday = first.getDay();
        const leadDays = firstWeekday === 0 ? 6 : firstWeekday - 1;
        const totalCells = leadDays + last.getDate();
        const rows = Math.ceil(totalCells / 7);

        const cells: (Date | null)[] = [];
        for (let i = 0; i < leadDays; i++) cells.push(null);
        for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null);

        const monthName = first.toLocaleDateString("en-US", { month: "long" });
        const monthNotes = notesByDate
          ? Object.entries(notesByDate).filter(([k]) => {
              const d = parseDateKey(k);
              return d.getFullYear() === year && d.getMonth() === month;
            })
          : [];
        const hasMonthNotes = monthNotes.length > 0;

        return (
          <div key={month} className="border-b border-black/10 pb-4">
            {/* Month header */}
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-[14px] font-bold tracking-tight text-black">{monthName}</h3>
              {hasMonthNotes && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-black/40">
                  {monthNotes.length} note{monthNotes.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Day grid — 7 columns, bigger cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={i} className="h-7" />;
                const k = dateKeyOf(d);
                const pct = data[k];
                const isFuture = k > todayKey;
                const isToday = k === todayKey;
                const dayNotes = notesByDate?.[k] ?? [];
                const hasNotes = dayNotes.length > 0;
                return (
                  <Link
                    key={i}
                    href={`/?date=${k}`}
                    className={cn(
                      "relative h-7 border border-black/5 transition hover:ring-1 hover:ring-black flex items-start justify-end p-0.5 group",
                      heatColor(pct, isFuture),
                      isToday && "ring-1 ring-black"
                    )}
                    title={`${k}: ${pct === undefined ? "no data" : `${pct}%`}${hasNotes ? ` · ${dayNotes.length} note${dayNotes.length > 1 ? "s" : ""}: ${dayNotes.map(n => n.content.slice(0, 30)).join("; ")}` : ""}`}
                  >
                    <span className="text-[7px] font-bold tabular-nums text-black/50 leading-none">
                      {d.getDate()}
                    </span>
                    {hasNotes && (
                      <span
                        className={cn(
                          "absolute top-0 left-0 h-1.5 w-1.5 border border-black/20",
                          NOTE_BG[dayNotes[0].color] ?? NOTE_BG.acid
                        )}
                      />
                    )}
                    {/* Hover tooltip */}
                    {hasNotes && (
                      <div className="absolute bottom-full left-1/2 z-20 mb-1 hidden -translate-x-1/2 group-hover:block">
                        <div className="border-2 border-black bg-white p-2 shadow-lg min-w-[140px] max-w-[180px]">
                          <div className="text-[8px] font-bold uppercase tracking-wider text-black/40 mb-1">
                            {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                          {dayNotes.slice(0, 3).map((note) => (
                            <div
                              key={note.id}
                              className={cn(
                                "px-1.5 py-0.5 text-[9px] font-medium leading-tight mb-0.5 border border-black/20",
                                NOTE_BG[note.color] ?? NOTE_BG.acid,
                                NOTE_TEXT[note.color] ?? NOTE_TEXT.acid
                              )}
                            >
                              {note.pinned && "★ "}
                              {note.content.slice(0, 35)}
                              {note.content.length > 35 ? "…" : ""}
                            </div>
                          ))}
                          {dayNotes.length > 3 && (
                            <div className="text-[8px] font-bold uppercase text-black/40 mt-0.5">
                              +{dayNotes.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase text-black/40 pt-2">
        <span>slacked</span>
        <span className="h-4 w-4 bg-black" />
        <span className="h-4 w-4 bg-black/20" />
        <span className="h-4 w-4 bg-black/40" />
        <span className="h-4 w-4 bg-[var(--acid-dim)]" />
        <span className="h-4 w-4 bg-[var(--acid)]" />
        <span>perfect</span>
        <span className="ml-3 flex items-center gap-1">
          <span className="h-1.5 w-1.5 bg-[var(--acid)] border border-black/20" />
          <span>notes (hover to read)</span>
        </span>
      </div>
    </div>
  );
}
