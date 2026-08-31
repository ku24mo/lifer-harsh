"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft, Footprints, Smartphone, Moon } from "lucide-react";
import {
  SECTIONS,
  blocksForDay,
  type SectionKey,
  type SectionDef,
  type RhythmBlock,
} from "@/lib/rhythm";
import {
  cn,
  dateKey,
  parseDateKey,
  addDays,
  nowMinutes,
  formatTime,
  minutesOf,
} from "@/lib/utils";
import { fetchDayBundle, fetchRangeBundle, fetchStickyNotes } from "@/lib/data-client";
import { BlockRow } from "./BlockRow";
import { QuoteField } from "./QuoteField";
import { StatsBar } from "./StatsBar";
import { ManifestoTicker } from "./ManifestoTicker";
import { StickyNotes } from "./StickyNotes";
import { HeroTimer } from "./HeroTimer";
import type { BlockCompletionRow, DayRow, StickyNoteRow } from "@/lib/types";

interface HealthAverages {
  avgSteps: number | null;
  avgScreenTimeMin: number | null;
  avgSleepHours: number | null;
  daysWithData: number;
}

interface Props {
  date: string;
  day: DayRow | null;
  blocks: BlockCompletionRow[];
  stickyNotes: StickyNoteRow[];
  healthAverages?: HealthAverages;
}

export function DayView({ date, day: initialDay, blocks: initialBlocks, stickyNotes: initialNotes, healthAverages }: Props) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [day, setDay] = useState<DayRow | null>(initialDay);
  const [blocks, setBlocks] = useState<BlockCompletionRow[]>(initialBlocks);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteRow[]>(initialNotes);
  const [zoomedSection, setZoomedSection] = useState<SectionKey | null>(null);

  const [rangeBundle, setRangeBundle] = useState<
    Record<string, { day: DayRow | null; blocks: BlockCompletionRow[] }>
  >({});

  // Optimistic block toggle — updates local state immediately
  const handleBlockToggle = useCallback((blockKey: string, completed: boolean) => {
    setBlocks((prev) => {
      const existing = prev.find((b) => b.block_key === blockKey);
      if (existing) {
        return prev.map((b) =>
          b.block_key === blockKey ? { ...b, completed } : b
        );
      }
      return [...prev, { date: selectedDate, block_key: blockKey, completed } as BlockCompletionRow];
    });
  }, [selectedDate]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000); // update every 30s
    return () => clearInterval(id);
  }, []);

  const now = useMemo(() => new Date(), [selectedDate, zoomedSection, tick]);
  const isToday = selectedDate === dateKey(new Date());
  const todayKey = dateKey(new Date());

  const load = useCallback(async (d: string) => {
    const [bundle, notes] = await Promise.all([
      fetchDayBundle(d),
      fetchStickyNotes(d),
    ]);
    setDay(bundle.day);
    setBlocks(bundle.blocks);
    setStickyNotes(notes);
  }, []);

  const loadRange = useCallback(async () => {
    const end = todayKey;
    const start = dateKey(addDays(parseDateKey(end), -30));
    const b = await fetchRangeBundle(start, end);
    setRangeBundle(b);
  }, [todayKey]);

  useEffect(() => {
    if (selectedDate !== date) load(selectedDate);
  }, [selectedDate, date, load]);

  useEffect(() => {
    loadRange();
  }, [loadRange]);

  const d = parseDateKey(selectedDate);
  const weekday = d.getDay();
  const applicable: RhythmBlock[] = blocksForDay(weekday);
  const blockMap = new Map(blocks.map((b) => [b.block_key, b]));
  const nowMins = isToday ? nowMinutes(now) : -1;

  const completedCount = applicable.filter(
    (b) => blockMap.get(b.key)?.completed
  ).length;
  const completionPct =
    applicable.length === 0
      ? 100
      : Math.round((completedCount / applicable.length) * 100);

  const hasJournal = !!day?.journal_free || day?.energy != null;

  const go = (delta: number) => {
    setZoomedSection(null);
    setSelectedDate(dateKey(addDays(d, delta)));
  };

  const isFuture = selectedDate > todayKey;

  const sectionBlocks = (key: SectionKey): RhythmBlock[] =>
    applicable.filter((b) => b.section === key);

  // Find current section
  const currentBlock = isToday
    ? applicable.find((b) => {
        const s = minutesOf(b.start);
        const e = minutesOf(b.end);
        return nowMins >= s && nowMins < e;
      })
    : null;
  const currentSectionKey = currentBlock?.section ?? null;

  // Zoomed section
  const zoomed = zoomedSection
    ? SECTIONS.find((s) => s.key === zoomedSection)
    : null;
  const zoomedBlocks = zoomedSection ? sectionBlocks(zoomedSection) : [];

  return (
    <div className="relative">
      {/* Manifesto slam — full width, always at top */}
      <ManifestoTicker variant="fullwidth" />

      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-6 sm:py-8">
        {/* Desktop 2-column: left = stats/quote, right = sections/notes */}
        <div className="lg:grid lg:grid-cols-[1fr_1.2fr] lg:gap-12 lg:items-start">
          {/* Left column — date, completion, stats, quote */}
          <div>
            {/* Date — asymmetric, oversized */}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--muted-2)]">
                  {isToday ? "today" : selectedDate}
                </div>
                <h2 className="mt-1 text-[36px] sm:text-[48px] lg:text-[56px] font-bold tracking-tighter leading-[0.9] text-black">
                  {d.toLocaleDateString("en-US", { weekday: "long" })}
                </h2>
                <p className="mt-1 text-[14px] text-[var(--muted)]">
                  {d.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                </p>
              </div>
              <div className="flex gap-1 pb-2">
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

            {/* Completion — huge number, raw, no box */}
            {!isFuture && (
              <div className="mt-8 flex items-end gap-4">
                <span
                  className={cn(
                    "text-[72px] sm:text-[100px] lg:text-[120px] font-bold tabular-nums leading-[0.8] tracking-tighter",
                    completionPct === 100
                      ? "text-black"
                      : completionPct >= 50
                        ? "text-black"
                        : "text-black/30"
                  )}
                >
                  {completionPct}
                  <span className="text-[36px] sm:text-[50px] lg:text-[60px]">%</span>
                </span>
                <div className="pb-3">
                  <p className="text-[14px] font-bold uppercase tracking-wider text-black">
                    {completionPct === 100
                      ? "LOCKED IN"
                      : `${completedCount}/${applicable.length} done`}
                  </p>
                  <p className="text-[12px] text-[var(--muted)]">
                    {completionPct === 100
                      ? "no excuses tomorrow"
                      : isFuture
                        ? "plan ahead"
                        : `${applicable.length - completedCount} remaining`}
                  </p>
                </div>
              </div>
            )}

            {/* Hero timer — big round stopwatch for current block (always visible) */}
            {isToday && currentBlock && !zoomedSection && (
              <div className="mt-8 flex justify-center">
                <HeroTimer
                  date={selectedDate}
                  block={currentBlock}
                  completion={blockMap.get(currentBlock.key)}
                />
              </div>
            )}

            {/* Stats — raw numbers, no boxes */}
            {!isFuture && (
              <div className="mt-8">
                <StatsBar bundle={rangeBundle} todayKey={todayKey} />
              </div>
            )}

            {/* Quote */}
            {!isFuture && (
              <div className="mt-8">
                <QuoteField date={selectedDate} initialQuote={day?.quote ?? null} />
              </div>
            )}

            {/* Journal link — goes to the journal book */}
            {!isFuture && (
              <Link
                href="/journal"
                className={cn(
                  "mt-8 flex items-center gap-2 border-t-2 border-black pt-4 transition",
                  hasJournal ? "text-black" : "text-black/40 hover:text-black"
                )}
              >
                <BookOpen className="h-4 w-4" />
                <span className="text-[12px] font-bold uppercase tracking-wider">
                  {hasJournal ? "journal written" : "write today's journal"}
                </span>
                <span className="ml-auto text-[11px] font-bold uppercase tracking-wider underline">
                  open book →
                </span>
              </Link>
            )}

            {/* Health check-in — today's metrics + 7-day averages */}
            {!isFuture && (
              <div className="mt-6 border-t-2 border-black pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
                    Health check-in
                  </div>
                  {healthAverages && healthAverages.daysWithData > 0 && (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-black/20">
                      7d avg
                    </span>
                  )}
                </div>

                {/* If no data logged today, show prompt + averages */}
                {day?.steps == null && day?.screen_time_min == null && day?.sleep_hours == null ? (
                  <div>
                    <Link
                      href="/journal"
                      className="flex items-center gap-2 text-black/30 transition hover:text-black mb-3"
                    >
                      <Footprints className="h-4 w-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">
                        log today's metrics →
                      </span>
                    </Link>
                    {healthAverages && healthAverages.daysWithData > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {healthAverages.avgSteps != null && (
                          <div className="flex flex-col items-center border-2 border-black/10 p-2 opacity-50">
                            <Footprints className="h-4 w-4 text-black/40 mb-1" />
                            <span className="text-[16px] font-bold tabular-nums text-black leading-none">
                              {healthAverages.avgSteps.toLocaleString()}
                            </span>
                            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-black/40">avg steps</span>
                          </div>
                        )}
                        {healthAverages.avgScreenTimeMin != null && (
                          <div className="flex flex-col items-center border-2 border-black/10 p-2 opacity-50">
                            <Smartphone className="h-4 w-4 text-black/40 mb-1" />
                            <span className="text-[16px] font-bold tabular-nums text-black leading-none">
                              {Math.floor(healthAverages.avgScreenTimeMin / 60)}h{healthAverages.avgScreenTimeMin % 60 > 0 ? `${healthAverages.avgScreenTimeMin % 60}m` : ""}
                            </span>
                            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-black/40">avg screen</span>
                          </div>
                        )}
                        {healthAverages.avgSleepHours != null && (
                          <div className="flex flex-col items-center border-2 border-black/10 p-2 opacity-50">
                            <Moon className="h-4 w-4 text-black/40 mb-1" />
                            <span className="text-[16px] font-bold tabular-nums text-black leading-none">
                              {healthAverages.avgSleepHours}h
                            </span>
                            <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-black/40">avg sleep</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Today's data logged — show today + averages */
                  <div className="grid grid-cols-3 gap-3">
                    {day?.steps != null && (
                      <div className="flex flex-col items-center border-2 border-black/10 p-2">
                        <Footprints className="h-4 w-4 text-black/40 mb-1" />
                        <span className="text-[18px] font-bold tabular-nums text-black leading-none">
                          {day.steps.toLocaleString()}
                        </span>
                        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-black/40">steps</span>
                        {healthAverages?.avgSteps != null && (
                          <span className="mt-1 text-[9px] font-bold tabular-nums text-black/30">
                            7d: {healthAverages.avgSteps.toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                    {day?.screen_time_min != null && (
                      <div className="flex flex-col items-center border-2 border-black/10 p-2">
                        <Smartphone className="h-4 w-4 text-black/40 mb-1" />
                        <span className="text-[18px] font-bold tabular-nums text-black leading-none">
                          {Math.floor(day.screen_time_min / 60)}h{day.screen_time_min % 60 > 0 ? `${day.screen_time_min % 60}m` : ""}
                        </span>
                        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-black/40">screen</span>
                        {healthAverages?.avgScreenTimeMin != null && (
                          <span className="mt-1 text-[9px] font-bold tabular-nums text-black/30">
                            7d: {Math.floor(healthAverages.avgScreenTimeMin / 60)}h{healthAverages.avgScreenTimeMin % 60 > 0 ? `${healthAverages.avgScreenTimeMin % 60}m` : ""}
                          </span>
                        )}
                      </div>
                    )}
                    {day?.sleep_hours != null && (
                      <div className="flex flex-col items-center border-2 border-black/10 p-2">
                        <Moon className="h-4 w-4 text-black/40 mb-1" />
                        <span className="text-[18px] font-bold tabular-nums text-black leading-none">
                          {day.sleep_hours}h
                        </span>
                        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-black/40">sleep</span>
                        {healthAverages?.avgSleepHours != null && (
                          <span className="mt-1 text-[9px] font-bold tabular-nums text-black/30">
                            7d: {healthAverages.avgSleepHours}h
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right column — sections + sticky notes */}
          <div className="mt-10 lg:mt-16">
            {/* Sections or zoomed detail */}
            {zoomed && zoomedSection ? (
              <div className="animate-zoom-in">
                {/* Zoomed section header */}
                <button
                  onClick={() => setZoomedSection(null)}
                  className="mb-6 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-black transition hover:text-[var(--muted)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <SectionHeader
                  section={zoomed}
                  blocks={zoomedBlocks}
                  completions={blocks}
                  isCurrent={currentSectionKey === zoomedSection}
                />
                <div className="mt-6 divide-y divide-black/10">
                  {zoomedBlocks.map((block) => (
                    <BlockRow
                      key={block.key}
                      date={selectedDate}
                      block={block}
                      completion={blockMap.get(block.key)}
                      isToday={isToday}
                      nowMins={nowMins}
                      onToggle={handleBlockToggle}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {SECTIONS.map((section, i) => {
                  const sBlocks = sectionBlocks(section.key);
                  if (sBlocks.length === 0) return null;
                  return (
                    <BrutalistSection
                      key={section.key}
                      section={section}
                      index={i}
                      blocks={sBlocks}
                      completions={blocks}
                      isToday={isToday}
                      nowMins={nowMins}
                      isCurrent={currentSectionKey === section.key}
                      onZoomIn={() => setZoomedSection(section.key)}
                    />
                  );
                })}
              </div>
            )}

            {/* Sticky notes — quick capture */}
            <StickyNotes date={selectedDate} notes={stickyNotes} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Brutalist section header — used in zoomed view */
function SectionHeader({
  section,
  blocks,
  completions,
  isCurrent,
}: {
  section: SectionDef;
  blocks: RhythmBlock[];
  completions: BlockCompletionRow[];
  isCurrent: boolean;
}) {
  const completionMap = new Map(completions.map((c) => [c.block_key, c]));
  const done = blocks.filter((b) => completionMap.get(b.key)?.completed).length;
  const pct = blocks.length === 0 ? 0 : Math.round((done / blocks.length) * 100);
  const firstStart = blocks[0] ? formatTime(minutesOf(blocks[0].start)) : "";
  const lastEnd = blocks[blocks.length - 1]
    ? formatTime(minutesOf(blocks[blocks.length - 1].end))
    : "";

  return (
    <div className="flex items-end justify-between border-b-2 border-black pb-3">
      <div>
        <span className="text-[10px] font-mono tabular-nums text-black/40">
          0{SECTIONS.findIndex((s) => s.key === section.key) + 1}
        </span>
        <h3 className="text-[32px] font-bold tracking-tighter leading-none text-black">
          {section.label}
        </h3>
        <p className="mt-1 text-[12px] text-[var(--muted)]">
          {firstStart} – {lastEnd}
        </p>
      </div>
      <div className="text-right">
        <span
          className={cn(
            "text-[40px] font-bold tabular-nums leading-none",
            pct === 100 ? "text-black" : "text-black/30"
          )}
        >
          {pct}%
        </span>
        {isCurrent && (
          <div className="mt-1 inline-block bg-[var(--acid)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
            live
          </div>
        )}
      </div>
    </div>
  );
}

/** Brutalist section block — numbered, oversized, raw */
function BrutalistSection({
  section,
  index,
  blocks,
  completions,
  isToday,
  nowMins,
  isCurrent,
  onZoomIn,
}: {
  section: SectionDef;
  index: number;
  blocks: RhythmBlock[];
  completions: BlockCompletionRow[];
  isToday: boolean;
  nowMins: number;
  isCurrent: boolean;
  onZoomIn: () => void;
}) {
  const completionMap = new Map(completions.map((c) => [c.block_key, c]));
  const done = blocks.filter((b) => completionMap.get(b.key)?.completed).length;
  const total = blocks.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const firstStart = blocks[0] ? formatTime(minutesOf(blocks[0].start)) : "";
  const lastEnd = blocks[blocks.length - 1]
    ? formatTime(minutesOf(blocks[blocks.length - 1].end))
    : "";

  return (
    <button
      onClick={onZoomIn}
      className={cn(
        "group block w-full text-left border-t-2 border-black pt-4 transition",
        isCurrent && "bg-[var(--acid)]/20 -mx-5 px-5 sm:-mx-8 sm:px-8"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-baseline gap-3">
          <span className="text-[14px] font-mono font-bold tabular-nums text-black/30">
            0{index + 1}
          </span>
          <div>
            <h3 className="text-[28px] sm:text-[32px] font-bold tracking-tighter leading-none text-black">
              {section.label}
            </h3>
            <p className="mt-1 text-[12px] text-[var(--muted)]">
              {firstStart} – {lastEnd} · {section.subtitle}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span
            className={cn(
              "text-[36px] font-bold tabular-nums leading-none",
              pct === 100 ? "text-black" : "text-black/20"
            )}
          >
            {pct}%
          </span>
        </div>
      </div>

      {/* Progress bar — raw, thick */}
      <div className="mt-4 h-2 w-full bg-black/10">
        <div
          className={cn(
            "h-full transition-all duration-500",
            pct === 100 ? "bg-black" : "bg-[var(--acid)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Block ticks — raw squares */}
      <div className="mt-3 flex items-center gap-1.5">
        {blocks.map((b) => {
          const c = completionMap.get(b.key);
          const isDone = c?.completed;
          return (
            <div
              key={b.key}
              className={cn(
                "h-3 flex-1 transition",
                isDone ? "bg-black" : "bg-black/10"
              )}
              title={b.label}
            />
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
        <span className="text-[var(--muted)]">
          {done}/{total} done
        </span>
        {isCurrent && (
          <span className="bg-[var(--acid)] px-2 py-0.5 text-black animate-pulse-acid">
            live now
          </span>
        )}
      </div>
    </button>
  );
}
