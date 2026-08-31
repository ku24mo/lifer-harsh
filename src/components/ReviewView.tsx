"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import { saveWeeklyReview, getWeeklyReview } from "@/lib/data";
import { dateKey, parseDateKey, addDays, startOfWeek } from "@/lib/utils";
import { ManifestoTicker } from "./ManifestoTicker";
import type { WeeklyReviewRow } from "@/lib/types";

interface Props {
  weekStart: string;
  review: WeeklyReviewRow | null;
}

export function ReviewView({ weekStart: initial, review: initialReview }: Props) {
  const [weekStart, setWeekStart] = useState(initial);
  const [wins, setWins] = useState(initialReview?.wins ?? "");
  const [slips, setSlips] = useState(initialReview?.slips ?? "");
  const [focus, setFocus] = useState(initialReview?.next_week_focus ?? "");
  const [saved, setSaved] = useState(false);

  const load = useCallback(async (ws: string) => {
    const r = await getWeeklyReview(ws);
    setWins(r?.wins ?? "");
    setSlips(r?.slips ?? "");
    setFocus(r?.next_week_focus ?? "");
  }, []);

  useEffect(() => {
    if (weekStart !== initial) load(weekStart);
  }, [weekStart, initial, load]);

  const go = (delta: number) =>
    setWeekStart(dateKey(addDays(parseDateKey(weekStart), delta * 7)));

  const handleSave = async () => {
    await saveWeeklyReview(weekStart, wins, slips, focus);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const start = parseDateKey(weekStart);
  const end = addDays(start, 6);
  const isThisWeek = weekStart === dateKey(startOfWeek(new Date()));
  const isFriday = new Date().getDay() === 5;

  return (
    <div className="relative">
      <ManifestoTicker variant="fullwidth" />
      <div className="mx-auto max-w-xl px-5 sm:px-8 py-8 sm:py-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-black/40">
            weekly review
          </div>
          <h2 className="mt-1 text-[36px] font-bold tracking-tighter leading-[0.9] text-black">
            {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </h2>
          <p className="mt-1 text-[12px] text-black/40">
            – {end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-1">
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

      {isThisWeek && isFriday && !wins && !slips && !focus && (
        <div className="mt-6 flex items-center gap-2 bg-[var(--acid)] px-4 py-3 text-[13px] font-bold uppercase tracking-wider text-black">
          <Sparkles className="h-4 w-4 shrink-0" />
          Friday. 10 minutes. Now.
        </div>
      )}

      <div className="mt-8 space-y-6">
        <Field
          label="01 — Wins"
          value={wins}
          onChange={setWins}
          placeholder="what moved the needle?"
        />
        <Field
          label="02 — Slips"
          value={slips}
          onChange={setSlips}
          placeholder="where did you slip?"
        />
        <Field
          label="03 — Next week"
          value={focus}
          onChange={setFocus}
          placeholder="the one thing that matters"
        />
      </div>

      <button
        onClick={handleSave}
        className="mt-8 flex w-full items-center justify-center gap-2 bg-black px-4 py-3 text-[14px] font-bold uppercase tracking-wider text-white transition hover:bg-[var(--acid)] hover:text-black"
      >
        {saved ? (
          <>
            <Check className="h-4 w-4" /> Saved
          </>
        ) : (
          "Save review"
        )}
      </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-bold uppercase tracking-wider text-black">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="mt-2 w-full border-2 border-black/10 bg-white px-3 py-2.5 text-[14px] text-black placeholder:text-black/30 outline-none focus:border-black"
      />
    </div>
  );
}
