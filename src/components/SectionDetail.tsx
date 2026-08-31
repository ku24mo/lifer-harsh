"use client";

import { ArrowLeft, Sunrise, Flame, Moon } from "lucide-react";
import { cn, formatTime, minutesOf } from "@/lib/utils";
import {
  SECTION_ACCENTS,
  type SectionDef,
  type SectionKey,
  type RhythmBlock,
} from "@/lib/rhythm";
import { BlockRow } from "./BlockRow";
import type { BlockCompletionRow } from "@/lib/types";

interface Props {
  section: SectionDef;
  blocks: RhythmBlock[];
  completions: BlockCompletionRow[];
  date: string;
  isToday: boolean;
  nowMins: number;
  onBack: () => void;
}

const ICONS: Record<SectionKey, typeof Sunrise> = {
  morning: Sunrise,
  work: Flame,
  evening: Moon,
};

export function SectionDetail({
  section,
  blocks,
  completions,
  date,
  isToday,
  nowMins,
  onBack,
}: Props) {
  const accent = SECTION_ACCENTS[section.accent];
  const Icon = ICONS[section.key];
  const completionMap = new Map(completions.map((c) => [c.block_key, c]));
  const done = blocks.filter((b) => completionMap.get(b.key)?.completed).length;
  const total = blocks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  const firstStart = blocks[0] ? formatTime(minutesOf(blocks[0].start)) : "";
  const lastEnd = blocks[blocks.length - 1]
    ? formatTime(minutesOf(blocks[blocks.length - 1].end))
    : "";

  return (
    <div className="animate-zoom-in">
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </button>

      <div className="flex items-center gap-3 mb-1">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            accent.bg
          )}
        >
          <Icon className={cn("h-5 w-5", accent.text)} />
        </div>
        <div className="flex-1">
          <h2 className="text-[20px] font-semibold tracking-tight text-[var(--foreground)]">
            {section.label}
          </h2>
          <p className="text-[12px] text-[var(--muted)]">
            {firstStart} – {lastEnd} · {section.subtitle}
          </p>
        </div>
        <div className="text-right">
          <span
            className={cn(
              "text-[22px] font-bold tabular-nums",
              pct === 100 ? "text-emerald-600" : accent.text
            )}
          >
            {pct}%
          </span>
        </div>
      </div>

      <div className="mt-4 divide-y divide-[var(--border)]">
        {blocks.map((block) => (
          <BlockRow
            key={block.key}
            date={date}
            block={block}
            completion={completionMap.get(block.key)}
            isToday={isToday}
            nowMins={nowMins}
          />
        ))}
      </div>
    </div>
  );
}
