"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, ArrowLeft, Dumbbell } from "lucide-react";
import { cn, dateKey, parseDateKey, addDays } from "@/lib/utils";
import { fetchGymCompletions, toggleGymExerciseClient, fetchDayBundle } from "@/lib/data-client";
import { HeroTimer } from "./HeroTimer";
import { RHYTHM, blocksForDay, type RhythmBlock } from "@/lib/rhythm";
import { workoutForDay } from "@/lib/workouts";
import type { BlockCompletionRow } from "@/lib/types";

interface Props {
  date: string;
  initialCompletions: Record<string, boolean>;
  initialBlockCompletion?: BlockCompletionRow | null;
}

export function GymView({ date, initialCompletions, initialBlockCompletion }: Props) {
  const [selectedDate, setSelectedDate] = useState(date);
  const [completions, setCompletions] = useState<Record<string, boolean>>(initialCompletions);
  const [blockCompletion, setBlockCompletion] = useState<BlockCompletionRow | null | undefined>(initialBlockCompletion);
  const [pending, startTransition] = useTransition();

  const d = parseDateKey(selectedDate);
  const weekday = d.getDay();
  const todayKey = dateKey(new Date());
  const isToday = selectedDate === todayKey;
  const isFuture = selectedDate > todayKey;

  const workout = workoutForDay(weekday);
  const gymBlock = useMemo(() => RHYTHM.find((b) => b.key === "gym"), []);

  // Sync state when date changes
  const [lastDate, setLastDate] = useState(selectedDate);
  if (selectedDate !== lastDate) {
    setLastDate(selectedDate);
    // Load completions for the new date
    (async () => {
      const [comps, bundle] = await Promise.all([
        fetchGymCompletions(selectedDate),
        (async () => {
          const b = await fetchDayBundle(selectedDate);
          return b.blocks.find((x) => x.block_key === "gym") ?? null;
        })(),
      ]);
      setCompletions(comps);
      setBlockCompletion(bundle);
    })();
  }

  const go = (delta: number) => {
    setSelectedDate(dateKey(addDays(d, delta)));
  };

  const handleToggle = (exerciseKey: string) => {
    const next = !completions[exerciseKey];
    setCompletions((prev) => ({ ...prev, [exerciseKey]: next }));
    startTransition(async () => {
      await toggleGymExerciseClient(selectedDate, exerciseKey, next);
    });
  };

  if (!workout) {
    return (
      <div className="text-center py-16">
        <Dumbbell className="h-12 w-12 mx-auto text-black/20" />
        <p className="mt-4 text-[14px] font-bold uppercase tracking-wider text-black/40">
          rest day
        </p>
        <p className="mt-2 text-[12px] text-[var(--muted)]">
          no workout scheduled for {d.toLocaleDateString("en-US", { weekday: "long" })}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => go(-1)}
            className="flex h-10 w-10 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(1)}
            className="flex h-10 w-10 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  // Count completions — exercises + finisher
  const allKeys = [...workout.exercises.map((e) => e.key), "finisher"];
  const doneCount = allKeys.filter((k) => completions[k]).length;
  const totalCount = allKeys.length;
  const pct = Math.round((doneCount / totalCount) * 100);

  // Hero timer: only show if today and gym block exists for this weekday
  const showHeroTimer = isToday && gymBlock && blocksForDay(weekday).some((b) => b.key === "gym");

  return (
    <div className="relative">
      {/* Date navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-black transition hover:text-[var(--muted)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to day
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => go(-1)}
            className="flex h-9 w-9 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-[12px] font-bold uppercase tracking-wider text-black min-w-[100px] text-center">
            {isToday ? "today" : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
          <button
            onClick={() => go(1)}
            className="flex h-9 w-9 items-center justify-center border-2 border-black text-black transition hover:bg-black hover:text-white"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Workout header */}
      <div className="border-t-2 border-black pt-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/40">
          {d.toLocaleDateString("en-US", { weekday: "long" })}
        </div>
        <h1 className="mt-1 text-[36px] sm:text-[44px] font-bold tracking-tighter leading-[0.9] text-black">
          {workout.title}
        </h1>
        <p className="mt-2 text-[14px] text-[var(--muted)]">
          {workout.subtitle}
        </p>
      </div>

      {/* Progress */}
      <div className="mt-6 flex items-end justify-between">
        <div>
          <span
            className={cn(
              "text-[60px] sm:text-[80px] font-bold tabular-nums leading-none",
              pct === 100 ? "text-black" : "text-black/30"
            )}
          >
            {pct}
            <span className="text-[36px] sm:text-[50px]">%</span>
          </span>
          <div className="pb-2">
            <p className="text-[14px] font-bold uppercase tracking-wider text-black">
              {pct === 100 ? "LOCKED IN" : `${doneCount}/${totalCount} done`}
            </p>
            <p className="text-[12px] text-[var(--muted)]">
              {pct === 100 ? "beast mode" : `${totalCount - doneCount} remaining`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-2 w-full bg-black/10">
        <div
          className={cn(
            "h-full transition-all duration-500",
            pct === 100 ? "bg-black" : "bg-[var(--acid)]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Hero timer — sense of urgency */}
      {showHeroTimer && gymBlock && (
        <div className="mt-10 flex justify-center">
          <HeroTimer
            date={selectedDate}
            block={gymBlock as RhythmBlock}
            completion={blockCompletion ?? undefined}
          />
        </div>
      )}

      {/* Exercise list */}
      <div className="mt-10 divide-y divide-black/10">
        {workout.exercises.map((ex, i) => {
          const isDone = !!completions[ex.key];
          return (
            <ExerciseRow
              key={ex.key}
              index={i + 1}
              name={ex.name}
              sets={ex.sets}
              reps={ex.reps}
              cues={ex.cues}
              done={isDone}
              disabled={isFuture}
              onToggle={() => handleToggle(ex.key)}
            />
          );
        })}
      </div>

      {/* Finisher */}
      <div className="mt-8 border-t-2 border-black pt-6">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/40 mb-3">
          finisher
        </div>
        <ExerciseRow
          index={null}
          name={workout.finisher}
          sets=""
          reps=""
          cues=""
          done={!!completions["finisher"]}
          disabled={isFuture}
          onToggle={() => handleToggle("finisher")}
          isFinisher
        />
      </div>
    </div>
  );
}

function ExerciseRow({
  index,
  name,
  sets,
  reps,
  cues,
  done,
  disabled,
  onToggle,
  isFinisher = false,
}: {
  index: number | null;
  name: string;
  sets: string;
  reps: string;
  cues: string;
  done: boolean;
  disabled: boolean;
  onToggle: () => void;
  isFinisher?: boolean;
}) {
  const [justToggled, setJustToggled] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    onToggle();
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-start gap-4 py-4 text-left transition",
        disabled && "cursor-not-allowed opacity-50",
        justToggled && "animate-pop"
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black transition",
          done ? "bg-black text-white" : "bg-white text-transparent group-hover:bg-black/5"
        )}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {index !== null && (
            <span className="text-[12px] font-mono font-bold tabular-nums text-black/30">
              {String(index).padStart(2, "0")}
            </span>
          )}
          <h3
            className={cn(
              "text-[16px] sm:text-[18px] font-bold tracking-tight transition",
              done ? "text-black/40 line-through" : "text-black"
            )}
          >
            {name}
          </h3>
        </div>
        {!isFinisher && (sets || reps) && (
          <div className="mt-1 flex items-center gap-3 text-[12px] font-mono tabular-nums text-black/60">
            {sets && <span>{sets} sets</span>}
            {reps && <span>× {reps} reps</span>}
          </div>
        )}
        {cues && (
          <p className={cn("mt-1 text-[12px] text-[var(--muted)]", done && "line-through")}>
            {cues}
          </p>
        )}
      </div>
    </button>
  );
}
