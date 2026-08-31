"use client";

import { Flame, TrendingUp, Target, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { completionPctForDate } from "@/lib/completion";
import type { BlockCompletionRow, DayRow } from "@/lib/types";
import { parseDateKey, dateKey, addDays, startOfWeek } from "@/lib/utils";

interface Props {
  bundle: Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }>;
  todayKey: string;
}

export function StatsBar({ bundle, todayKey }: Props) {
  let streak = 0;
  const today = parseDateKey(todayKey);
  for (let i = 0; i < 365; i++) {
    const d = addDays(today, -i);
    const k = dateKey(d);
    if (k > todayKey) continue;
    const entry = bundle[k];
    if (!entry) {
      if (streak > 0) break;
      continue;
    }
    const pct = completionPctForDate(k, entry.blocks);
    if (pct === 100) streak++;
    else break;
  }

  const weekStart = dateKey(startOfWeek(today));
  let weekSum = 0;
  let weekCount = 0;
  for (let d = new Date(parseDateKey(weekStart)); d <= today; d.setDate(d.getDate() + 1)) {
    const k = dateKey(d);
    const entry = bundle[k];
    if (entry) {
      weekSum += completionPctForDate(k, entry.blocks);
      weekCount++;
    }
  }
  const weekAvg = weekCount > 0 ? Math.round(weekSum / weekCount) : 0;

  const monthStart = dateKey(new Date(today.getFullYear(), today.getMonth(), 1));
  let perfectDays = 0;
  let monthTotal = 0;
  for (let d = new Date(parseDateKey(monthStart)); d <= today; d.setDate(d.getDate() + 1)) {
    const k = dateKey(d);
    const entry = bundle[k];
    if (entry) {
      const pct = completionPctForDate(k, entry.blocks);
      if (pct === 100) perfectDays++;
      monthTotal++;
    }
  }

  const todayEntry = bundle[todayKey];
  const focusSeconds = todayEntry
    ? todayEntry.blocks.reduce((sum, b) => sum + (b.timer_seconds || 0), 0)
    : 0;
  const focusHours = Math.floor(focusSeconds / 3600);
  const focusMins = Math.floor((focusSeconds % 3600) / 60);

  const stats = [
    {
      label: "STREAK",
      value: `${streak}`,
      unit: streak === 1 ? "day" : "days",
      live: streak > 0,
    },
    {
      label: "WEEK",
      value: `${weekAvg}`,
      unit: "% avg",
      live: weekAvg >= 80,
    },
    {
      label: "PERFECT",
      value: `${perfectDays}`,
      unit: monthTotal > 0 ? `/${monthTotal}` : "this mo",
      live: perfectDays > 0,
    },
    {
      label: "FOCUS",
      value: focusHours > 0 ? `${focusHours}h` : `${focusMins}m`,
      unit: "today",
      live: focusSeconds > 0,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-0 border-t-2 border-black pt-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "px-2",
            i < 3 && "border-r-2 border-black/10"
          )}
        >
          <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/40">
            {s.label}
          </div>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span
              className={cn(
                "text-[24px] font-bold tabular-nums leading-none",
                s.live ? "text-black" : "text-black/20"
              )}
            >
              {s.value}
            </span>
            <span className="text-[9px] font-medium text-black/40">{s.unit}</span>
          </div>
          {s.live && (
            <div className="mt-1 h-1 w-full bg-[var(--acid)]" />
          )}
        </div>
      ))}
    </div>
  );
}
