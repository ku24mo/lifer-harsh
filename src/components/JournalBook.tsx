"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, PenLine, Footprints, Smartphone, Moon } from "lucide-react";
import { cn, dateKey, parseDateKey } from "@/lib/utils";
import { saveJournal } from "@/lib/data";
import type { DayRow } from "@/lib/types";

interface HealthAverages {
  avgSteps: number | null;
  avgScreenTimeMin: number | null;
  avgSleepHours: number | null;
  daysWithData: number;
}

interface Props {
  today: string;
  todayDay: DayRow | null;
  pastEntries: DayRow[];
  healthAverages?: HealthAverages;
}

export function JournalBook({ today, todayDay, pastEntries: initialPast, healthAverages }: Props) {
  const [free, setFree] = useState(todayDay?.journal_free ?? "");
  const [energy, setEnergy] = useState<number | null>(todayDay?.energy ?? null);
  const [steps, setSteps] = useState<string>(todayDay?.steps?.toString() ?? "");
  const [screenTime, setScreenTime] = useState<string>(todayDay?.screen_time_min?.toString() ?? "");
  const [sleepHours, setSleepHours] = useState<string>(todayDay?.sleep_hours?.toString() ?? "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pastEntries, setPastEntries] = useState(initialPast);

  const handleSave = async () => {
    setSaving(true);
    await saveJournal(
      today,
      {},
      free,
      energy,
      steps ? parseInt(steps) : null,
      screenTime ? parseInt(screenTime) : null,
      sleepHours ? parseFloat(sleepHours) : null,
    );
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    // Move today to top of past entries if it's not there
    setPastEntries((prev) => {
      const without = prev.filter((e) => e.date !== today);
      if (free.trim()) {
        return [{ ...todayDay, journal_free: free, energy, date: today } as DayRow, ...without];
      }
      return without;
    });
  };

  return (
    <div className="relative">
      {/* Today's entry — editable */}
      <div className="border-b-2 border-black pb-8">
        <div className="flex items-center gap-2 mb-4">
          <PenLine className="h-4 w-4 text-black" />
          <h2 className="text-[14px] font-bold uppercase tracking-wider text-black">
            Today
          </h2>
          <span className="text-[12px] text-black/40">
            {parseDateKey(today).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        <textarea
          value={free}
          onChange={(e) => setFree(e.target.value)}
          rows={12}
          autoFocus
          className="w-full border-2 border-black/10 bg-white px-4 py-3 text-[15px] leading-relaxed text-black placeholder:text-black/30 outline-none focus:border-black resize-none font-serif"
          placeholder="write…"
        />

        {/* Health metrics — quick log */}
        <div className="mt-4 border-2 border-black/10 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
              Daily check-in
            </div>
            {healthAverages && healthAverages.daysWithData > 0 && (
              <span className="text-[8px] font-bold uppercase tracking-wider text-black/20">
                your 7d avg: {healthAverages.avgSteps?.toLocaleString() ?? "—"} steps · {healthAverages.avgScreenTimeMin != null ? `${Math.floor(healthAverages.avgScreenTimeMin / 60)}h${healthAverages.avgScreenTimeMin % 60 > 0 ? `${healthAverages.avgScreenTimeMin % 60}m` : ""}` : "—"} screen · {healthAverages.avgSleepHours ?? "—"}h sleep
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* Steps */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-black/40">
                <Footprints className="h-3 w-3" /> Steps
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                placeholder="0"
                className="mt-1 w-full border-2 border-black/10 bg-white px-2 py-1.5 text-[16px] font-bold tabular-nums text-black placeholder:text-black/20 outline-none focus:border-black"
              />
            </div>
            {/* Screen time */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-black/40">
                <Smartphone className="h-3 w-3" /> Screen (min)
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={screenTime}
                onChange={(e) => setScreenTime(e.target.value)}
                placeholder="0"
                className="mt-1 w-full border-2 border-black/10 bg-white px-2 py-1.5 text-[16px] font-bold tabular-nums text-black placeholder:text-black/20 outline-none focus:border-black"
              />
            </div>
            {/* Sleep */}
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-black/40">
                <Moon className="h-3 w-3" /> Sleep (h)
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                placeholder="0"
                className="mt-1 w-full border-2 border-black/10 bg-white px-2 py-1.5 text-[16px] font-bold tabular-nums text-black placeholder:text-black/20 outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-black/40">
              energy
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEnergy(n)}
                  className={cn(
                    "h-8 w-8 border-2 border-black text-[12px] font-bold transition active:scale-90",
                    energy === n
                      ? "bg-[var(--acid)] text-black"
                      : "bg-white text-black/40 hover:bg-black hover:text-white"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-black px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white transition hover:bg-[var(--acid)] hover:text-black disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              "saving…"
            ) : saved ? (
              <>
                <Check className="h-4 w-4 animate-check-in" /> Saved
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </div>

      {/* Past entries — readable like a book */}
      <div className="mt-8 space-y-10">
        {pastEntries
          .filter((e) => e.date !== today)
          .filter((e) => e.journal_free && e.journal_free.trim())
          .map((entry) => {
          const d = parseDateKey(entry.date);
          return (
            <div key={entry.date} className="animate-fade-in">
              <div className="flex items-baseline gap-3 mb-3">
                <h3 className="text-[16px] font-bold tracking-tight text-black">
                  {d.toLocaleDateString("en-US", { weekday: "long" })}
                </h3>
                <span className="text-[12px] text-black/40">
                  {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {entry.energy != null && (
                  <span className="bg-[var(--acid)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                    energy {entry.energy}/5
                  </span>
                )}
              </div>

              {/* Health metrics for past entries */}
              {(entry.steps != null || entry.screen_time_min != null || entry.sleep_hours != null) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {entry.steps != null && (
                    <span className="flex items-center gap-1 border border-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black/60">
                      <Footprints className="h-3 w-3" /> {entry.steps.toLocaleString()} steps
                    </span>
                  )}
                  {entry.screen_time_min != null && (
                    <span className="flex items-center gap-1 border border-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black/60">
                      <Smartphone className="h-3 w-3" /> {Math.floor(entry.screen_time_min / 60)}h {entry.screen_time_min % 60}m
                    </span>
                  )}
                  {entry.sleep_hours != null && (
                    <span className="flex items-center gap-1 border border-black/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black/60">
                      <Moon className="h-3 w-3" /> {entry.sleep_hours}h sleep
                    </span>
                  )}
                </div>
              )}

              <div className="border-l-2 border-black pl-4">
                <p className="text-[15px] leading-relaxed text-black whitespace-pre-wrap font-serif">
                  {entry.journal_free}
                </p>
              </div>
            </div>
          );
        })}

        {pastEntries.filter((e) => e.date !== today && e.journal_free?.trim()).length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-black/20">
              no past entries yet. your book starts today.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
