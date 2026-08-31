"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, Pencil } from "lucide-react";
import { cn, formatTime, minutesOf } from "@/lib/utils";
import { blockDurationSec, type RhythmBlock } from "@/lib/rhythm";
import { toggleBlockComplete, saveBlockNotes } from "@/lib/data";
import { CountdownTimer } from "./CountdownTimer";
import type { BlockCompletionRow } from "@/lib/types";

interface Props {
  date: string;
  block: RhythmBlock;
  completion: BlockCompletionRow | undefined;
  isToday: boolean;
  nowMins: number;
  onToggle?: (blockKey: string, completed: boolean) => void;
}

export function BlockRow({ date, block, completion, isToday, nowMins, onToggle }: Props) {
  const startMin = minutesOf(block.start);
  const endMin = minutesOf(block.end);
  const isCurrent = isToday && nowMins >= startMin && nowMins < endMin;
  const isPast = isToday && nowMins >= endMin;
  const serverCompleted = completion?.completed ?? false;
  const [optimisticCompleted, setOptimisticCompleted] = useState(serverCompleted);
  const [justToggled, setJustToggled] = useState(false);
  const completed = optimisticCompleted;
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();

  const [intention, setIntention] = useState(completion?.intention ?? "");
  const [outcome, setOutcome] = useState(completion?.outcome ?? "");
  const [notesSaved, setNotesSaved] = useState(false);

  // Sync from server when completion prop changes (e.g. date navigation)
  const [lastServerKey, setLastServerKey] = useState(block.key + date);
  if ((block.key + date) !== lastServerKey) {
    setOptimisticCompleted(serverCompleted);
    setLastServerKey(block.key + date);
  }

  const handleToggle = () => {
    const next = !completed;
    setOptimisticCompleted(next);
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 600);
    onToggle?.(block.key, next);
    startTransition(async () => {
      await toggleBlockComplete(date, block.key, next);
    });
  };

  const handleSaveNotes = () => {
    startTransition(async () => {
      await saveBlockNotes(date, block.key, intention, outcome);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 1500);
    });
  };

  return (
    <div
      className={cn(
        "py-3.5 transition",
        isCurrent && "bg-[var(--acid)]/15 -mx-5 px-5 sm:-mx-8 sm:px-8"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggle}
          disabled={pending}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 border-black transition-all duration-150 active:scale-90",
            completed ? "bg-black scale-100" : "bg-white hover:bg-[var(--acid)] hover:scale-110",
            justToggled && "animate-pop",
            pending && "opacity-50"
          )}
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
        >
          {completed && <Check className="h-3 w-3 text-white animate-check-in" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] tabular-nums text-black/40">
              {formatTime(startMin)}
            </span>
            {isCurrent && (
              <span className="bg-[var(--acid)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-black animate-pulse-acid">
                now
              </span>
            )}
            {isPast && !completed && (
              <span className="bg-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                missed
              </span>
            )}
          </div>
          <h3
            className={cn(
              "mt-0.5 text-[15px] font-semibold leading-snug transition-all duration-200",
              completed ? "text-black/30 line-through" : "text-black"
            )}
          >
            {block.label}
          </h3>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className={cn(
            "mt-0.5 flex h-6 w-6 items-center justify-center text-black/30 hover:text-black transition active:scale-90",
            block.type !== "work" && "invisible"
          )}
          aria-label="Expand notes"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
          />
        </button>
      </div>

      {block.timer && (
        <div className="mt-2 pl-8">
          <CountdownTimer
            date={date}
            blockKey={block.key}
            blockLabel={block.label}
            durationSec={blockDurationSec(block)}
            initial={{
              timer_seconds: completion?.timer_seconds ?? 0,
              timer_running: completion?.timer_running ?? false,
              timer_started_at: completion?.timer_started_at ?? null,
            }}
            completed={completed}
            accentBar="bg-[var(--acid)]"
          />
        </div>
      )}

      {expanded && block.type === "work" && (
        <div className="mt-3 pl-8 space-y-2.5 animate-fade-in">
          <div>
            <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-black/40">
              <Pencil className="h-3 w-3" /> Intention
            </label>
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="what I intend to do…"
              rows={2}
              className="mt-1 w-full border-2 border-black/10 bg-white px-3 py-2 text-[13px] text-black placeholder:text-black/30 outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-black/40">
              <Check className="h-3 w-3" /> Outcome
            </label>
            <textarea
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="what I actually did…"
              rows={2}
              className="mt-1 w-full border-2 border-black/10 bg-white px-3 py-2 text-[13px] text-black placeholder:text-black/30 outline-none focus:border-black"
            />
          </div>
          {notesSaved && (
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-black animate-fade-in">
              <Check className="h-3 w-3" /> saved
            </div>
          )}
        </div>
      )}
    </div>
  );
}
