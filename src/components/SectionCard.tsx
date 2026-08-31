"use client";

import { Sunrise, Flame, Moon, ChevronRight, Check } from "lucide-react";
import { cn, formatTime, minutesOf } from "@/lib/utils";
import {
  SECTION_ACCENTS,
  type SectionDef,
  type SectionKey,
  type RhythmBlock,
} from "@/lib/rhythm";
import type { BlockCompletionRow } from "@/lib/types";

interface Props {
  section: SectionDef;
  blocks: RhythmBlock[];
  completions: BlockCompletionRow[];
  isToday: boolean;
  nowMins: number;
  onZoomIn: () => void;
}

const ICONS: Record<SectionKey, typeof Sunrise> = {
  morning: Sunrise,
  work: Flame,
  evening: Moon,
};

export function SectionCard({
  section,
  blocks,
  completions,
  isToday,
  nowMins,
  onZoomIn,
}: Props) {
  const accent = SECTION_ACCENTS[section.accent];
  const Icon = ICONS[section.key];
  const completionMap = new Map(completions.map((c) => [c.block_key, c]));

  const done = blocks.filter((b) => completionMap.get(b.key)?.completed).length;
  const total = blocks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const currentBlock = blocks.find((b) => {
    const s = minutesOf(b.start);
    const e = minutesOf(b.end);
    return isToday && nowMins >= s && nowMins < e;
  });

  const firstStart = blocks[0] ? formatTime(minutesOf(blocks[0].start)) : "";
  const lastEnd = blocks[blocks.length - 1]
    ? formatTime(minutesOf(blocks[blocks.length - 1].end))
    : "";

  return (
    <button
      onClick={onZoomIn}
      className={cn(
        "group relative text-left transition-all duration-200 rounded-xl p-4",
        "hover:bg-[var(--surface-2)]",
        currentBlock && cn(accent.bg, "ring-1", accent.ring)
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg",
            accent.bg
          )}
        >
          <Icon className={cn("h-[18px] w-[18px]", accent.text)} />
        </div>
        <div className="text-right">
          <div
            className={cn(
              "text-xl font-semibold tabular-nums",
              pct === 100
                ? "text-emerald-600"
                : pct > 0
                  ? accent.text
                  : "text-[var(--muted-2)]"
            )}
          >
            {pct}%
          </div>
        </div>
      </div>

      <h3 className="mt-3.5 text-[15px] font-semibold text-[var(--foreground)]">
        {section.label}
      </h3>
      <p className="text-[12px] text-[var(--muted)] mt-0.5">{section.subtitle}</p>

      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-[var(--muted-2)]">
        <span className="font-mono tabular-nums">
          {firstStart} – {lastEnd}
        </span>
        {currentBlock && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider animate-pulse-ring",
              accent.bg,
              accent.text
            )}
          >
            <span className={cn("h-1 w-1 rounded-full", accent.dot)} />
            live
          </span>
        )}
      </div>

      {/* Block dots */}
      <div className="mt-3 flex items-center gap-1">
        {blocks.map((b) => {
          const c = completionMap.get(b.key);
          const isDone = c?.completed;
          return (
            <div
              key={b.key}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                isDone ? cn(accent.bar) : "bg-[var(--border)]"
              )}
              title={b.label}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-1 text-[12px] font-medium text-[var(--muted)] transition group-hover:text-[var(--foreground)]">
        {done}/{total} done
        <ChevronRight className="ml-auto h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}
