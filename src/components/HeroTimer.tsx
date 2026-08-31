"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Check } from "lucide-react";
import { cn, formatDuration, minutesOf } from "@/lib/utils";
import { saveTimerState, toggleBlockComplete } from "@/lib/data";
import { blockDurationSec, type RhythmBlock } from "@/lib/rhythm";
import type { BlockCompletionRow } from "@/lib/types";

interface Props {
  date: string;
  block: RhythmBlock;
  completion: BlockCompletionRow | undefined;
}

/**
 * Big round stopwatch-style countdown timer for the main day view.
 * - Timer blocks (work/gym): manual start/stop, persists to DB
 * - Non-timer blocks (lunch/breakfast): passive countdown from real clock time
 */
export function HeroTimer({ date, block, completion }: Props) {
  const isTimerBlock = block.timer;
  const durationSec = blockDurationSec(block);

  // ── Timer block state (manual start/stop) ──
  const [elapsed, setElapsed] = useState(completion?.timer_seconds ?? 0);
  const [running, setRunning] = useState(completion?.timer_running ?? false);
  const startedAtRef = useRef<number | null>(
    completion?.timer_started_at ? new Date(completion.timer_started_at).getTime() : null
  );
  const baseElapsedRef = useRef<number>(completion?.timer_seconds ?? 0);
  const [justCompleted, setJustCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completed = completion?.completed ?? false;

  // ── Passive block state (clock-based countdown) ──
  const [clockRemaining, setClockRemaining] = useState(0);
  const [clockProgress, setClockProgress] = useState(0);

  // For passive blocks: calculate remaining time from real clock
  useEffect(() => {
    if (isTimerBlock) return;

    const tick = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      const startMin = minutesOf(block.start);
      const endMin = minutesOf(block.end);
      const blockDurMin = endMin - startMin;
      const elapsedMin = Math.max(0, nowMins - startMin);
      const remainingMin = Math.max(0, endMin - nowMins);
      setClockRemaining(Math.floor(remainingMin * 60));
      setClockProgress(Math.min(1, elapsedMin / blockDurMin));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isTimerBlock, block.start, block.end]);

  // Timer block: sync from server on completion change
  useEffect(() => {
    if (!isTimerBlock || !completion) return;
    setElapsed(completion.timer_seconds ?? 0);
    setRunning(completion.timer_running ?? false);
    baseElapsedRef.current = completion.timer_seconds ?? 0;
    startedAtRef.current = completion.timer_started_at
      ? new Date(completion.timer_started_at).getTime()
      : null;
  }, [completion, isTimerBlock]);

  // Timer block: auto-start when the block's time window begins
  useEffect(() => {
    if (!isTimerBlock || completed) return;
    const startMin = minutesOf(block.start);
    const endMin = minutesOf(block.end);

    const checkAutoStart = () => {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      // Only auto-start if we're inside the block window and not already running
      if (nowMins >= startMin && nowMins < endMin && !running && elapsed === 0) {
        handleStart();
      }
    };

    checkAutoStart();
    const id = setInterval(checkAutoStart, 5000); // check every 5s
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerBlock, completed, block.start, block.end, running, elapsed]);

  // Timer block: on mount, sync if was running across reload
  useEffect(() => {
    if (!isTimerBlock) return;
    if (completion?.timer_running && completion?.timer_started_at) {
      const startedMs = new Date(completion.timer_started_at).getTime();
      const total =
        (completion.timer_seconds ?? 0) + Math.floor((Date.now() - startedMs) / 1000);
      if (total >= durationSec) {
        handleComplete();
      } else {
        baseElapsedRef.current = completion.timer_seconds ?? 0;
        startedAtRef.current = startedMs;
        setElapsed(total);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer block: tick loop
  useEffect(() => {
    if (!isTimerBlock || !running) {
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
  }, [running, durationSec, isTimerBlock]);

  const persist = useCallback(
    async (nextElapsed: number, nextRunning: boolean, startedAtMs: number | null) => {
      try {
        await saveTimerState(date, block.key, {
          timer_seconds: nextElapsed,
          timer_running: nextRunning,
          timer_started_at: startedAtMs ? new Date(startedAtMs).toISOString() : null,
        });
      } catch (e) {
        console.error("timer persist failed", e);
      }
    },
    [date, block.key]
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
    await toggleBlockComplete(date, block.key, true);
  };

  // Compute display values
  const remaining = isTimerBlock ? Math.max(0, durationSec - elapsed) : clockRemaining;
  const progress = isTimerBlock ? Math.min(1, elapsed / durationSec) : clockProgress;
  const isDone = isTimerBlock
    ? completed || elapsed >= durationSec
    : clockRemaining <= 0;

  // Large SVG ring — stopwatch style
  const size = 200;
  const stroke = 5;
  const R = (size - stroke) / 2;
  const C = 2 * Math.PI * R;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      {/* Block label */}
      <div className="mb-4 text-center">
        <span className="bg-[var(--acid)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
          live now
        </span>
        <h3 className="mt-2 text-[18px] font-bold tracking-tight text-black">
          {block.label}
        </h3>
      </div>

      {/* Big round timer — no box, just the ring */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="-rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-black/8"
          />
          {/* Progress ring */}
          <circle
            cx={center}
            cy={center}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="square"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)}
            className={cn(
              "transition-[stroke-dashoffset] duration-1000 ease-linear",
              isDone ? "text-black" : "text-[var(--acid)]"
            )}
          />
          {/* Tick marks — stopwatch style (12 ticks) */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = Math.round((center + (R - 10) * Math.cos(angle)) * 100) / 100;
            const y1 = Math.round((center + (R - 10) * Math.sin(angle)) * 100) / 100;
            const x2 = Math.round((center + (R - 2) * Math.cos(angle)) * 100) / 100;
            const y2 = Math.round((center + (R - 2) * Math.sin(angle)) * 100) / 100;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth={i % 3 === 0 ? 2.5 : 1.5}
                className="text-black/15"
              />
            );
          })}
        </svg>

        {/* Center — time + controls inside the ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          {isDone ? (
            <>
              <Check className="h-12 w-12 text-black" strokeWidth={3} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-black">
                done
              </span>
            </>
          ) : (
            <>
              <span className="font-mono text-[36px] font-bold tabular-nums leading-none text-black">
                {formatDuration(remaining)}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-black/40">
                {isTimerBlock
                  ? running ? "running" : "remaining"
                  : "counting down"}
              </span>

              {/* Controls — only for timer blocks */}
              {isTimerBlock && (
                <div className="mt-1 flex items-center gap-2">
                  {running ? (
                    <button
                      onClick={handlePause}
                      className="flex h-10 w-10 items-center justify-center border-2 border-black bg-black text-white transition hover:bg-white hover:text-black"
                      aria-label="Pause"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleStart}
                      className="flex h-10 w-10 items-center justify-center border-2 border-black bg-[var(--acid)] text-black transition hover:bg-black hover:text-white"
                      aria-label="Start"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={handleReset}
                    className="flex h-8 w-8 items-center justify-center text-black/30 transition hover:text-black"
                    aria-label="Reset"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {justCompleted && (
        <span className="mt-3 text-[11px] font-bold uppercase tracking-wider text-black">
          locked in
        </span>
      )}
    </div>
  );
}
