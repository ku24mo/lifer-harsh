"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import { saveTimerState, toggleBlockComplete } from "@/lib/data";
import { blockDurationSec } from "@/lib/rhythm";

interface Props {
  date: string;
  blockKey: string;
  blockLabel: string;
  durationSec: number;
  initial: {
    timer_seconds: number;
    timer_running: boolean;
    timer_started_at: string | null;
  };
  completed: boolean;
  accentBar: string;
}

export function CountdownTimer({
  date,
  blockKey,
  blockLabel,
  durationSec,
  initial,
  completed,
  accentBar,
}: Props) {
  const [elapsed, setElapsed] = useState(initial.timer_seconds);
  const [running, setRunning] = useState(initial.timer_running);
  const startedAtRef = useRef<number | null>(
    initial.timer_started_at ? new Date(initial.timer_started_at).getTime() : null
  );
  // Base elapsed captured when the current run started (for tick math).
  const baseElapsedRef = useRef<number>(initial.timer_seconds);
  const [justCompleted, setJustCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // On mount: if timer was running across a reload, sync elapsed from started_at.
  useEffect(() => {
    if (initial.timer_running && initial.timer_started_at) {
      const startedMs = new Date(initial.timer_started_at).getTime();
      const total =
        initial.timer_seconds + Math.floor((Date.now() - startedMs) / 1000);
      if (total >= durationSec) {
        // Ran past duration while away — complete it.
        handleComplete();
      } else {
        baseElapsedRef.current = initial.timer_seconds;
        startedAtRef.current = startedMs;
        setElapsed(total);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick loop while running.
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (startedAtRef.current != null) {
        const now = Date.now();
        const total =
          baseElapsedRef.current +
          Math.floor((now - startedAtRef.current) / 1000);
        setElapsed(total);
        if (total >= durationSec) {
          handleComplete();
        }
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, durationSec]);

  const persist = useCallback(
    async (nextElapsed: number, nextRunning: boolean, startedAtMs: number | null) => {
      try {
        await saveTimerState(date, blockKey, {
          timer_seconds: nextElapsed,
          timer_running: nextRunning,
          timer_started_at: startedAtMs ? new Date(startedAtMs).toISOString() : null,
        });
      } catch (e) {
        console.error("timer persist failed", e);
      }
    },
    [date, blockKey]
  );

  const handleStart = () => {
    if (completed) return;
    const now = Date.now();
    baseElapsedRef.current = elapsed;
    startedAtRef.current = now;
    setRunning(true);
    persist(elapsed, true, now);
  };

  const handlePause = () => {
    const now = Date.now();
    let nextElapsed = elapsed;
    if (startedAtRef.current != null) {
      nextElapsed =
        baseElapsedRef.current +
        Math.floor((now - startedAtRef.current) / 1000);
      setElapsed(nextElapsed);
    }
    baseElapsedRef.current = nextElapsed;
    startedAtRef.current = null;
    setRunning(false);
    persist(nextElapsed, false, null);
  };

  const handleReset = () => {
    startedAtRef.current = null;
    setRunning(false);
    setElapsed(0);
    persist(0, false, null);
  };

  const handleComplete = async () => {
    startedAtRef.current = null;
    setRunning(false);
    setElapsed(durationSec);
    setJustCompleted(true);
    await persist(durationSec, false, null);
    await toggleBlockComplete(date, blockKey, true);
  };

  const remaining = Math.max(0, durationSec - elapsed);
  const progress = Math.min(1, elapsed / durationSec);
  const isDone = completed || elapsed >= durationSec;

  // SVG ring
  const R = 18;
  const C = 2 * Math.PI * R;

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 shrink-0">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-black/10"
          />
          <circle
            cx="22"
            cy="22"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            className={cn("transition-[stroke-dashoffset] duration-1000 ease-linear", accentBar)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isDone ? (
            <Check className="h-4 w-4 text-black" strokeWidth={3} />
          ) : (
            <span className="text-[9px] font-mono font-bold tabular-nums text-black/60">
              {Math.ceil(remaining / 60)}m
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <span className="font-mono text-[13px] font-bold tabular-nums text-black">
          {formatDuration(remaining)}
        </span>
        <span className="text-[9px] font-medium uppercase tracking-wider text-black/40">
          {running ? "running" : "left"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        {!isDone && (
          <>
            {running ? (
              <button
                onClick={handlePause}
                className="flex h-7 w-7 items-center justify-center border-2 border-black bg-black text-white transition hover:bg-white hover:text-black"
                aria-label="Pause"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex h-7 w-7 items-center justify-center border-2 border-black bg-[var(--acid)] text-black transition hover:bg-black hover:text-white"
                aria-label="Start"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex h-7 w-7 items-center justify-center text-black/30 hover:text-black"
              aria-label="Reset"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
