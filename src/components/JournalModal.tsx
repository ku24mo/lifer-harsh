"use client";

import { useState, useEffect } from "react";
import { X, PenLine, Check } from "lucide-react";
import { saveJournal } from "@/lib/data";
import { cn } from "@/lib/utils";

interface Props {
  date: string;
  initialFree: string | null;
  initialEnergy: number | null;
  onClose: () => void;
}

export function JournalModal({
  date,
  initialFree,
  initialEnergy,
  onClose,
}: Props) {
  const [free, setFree] = useState(initialFree ?? "");
  const [energy, setEnergy] = useState<number | null>(initialEnergy);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSave = async () => {
    await saveJournal(date, {}, free, energy);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-white border-2 border-black safe-bottom">
        <div className="sticky top-0 flex items-center justify-between border-b-2 border-black bg-[var(--acid)] px-5 py-4">
          <div className="flex items-center gap-2">
            <PenLine className="h-4 w-4 text-black" />
            <h2 className="text-[16px] font-bold uppercase tracking-tight text-black">
              Journal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-black transition hover:bg-black hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          <div>
            <label className="text-[13px] font-bold text-black">
              What's on your mind?
            </label>
            <textarea
              value={free}
              onChange={(e) => setFree(e.target.value)}
              rows={10}
              autoFocus
              className="mt-1.5 w-full border-2 border-black/10 bg-white px-3 py-2.5 text-[14px] text-black placeholder:text-black/30 outline-none focus:border-black resize-none"
              placeholder="write whatever…"
            />
          </div>

          <div>
            <label className="text-[13px] font-bold text-black">
              Energy today
            </label>
            <div className="mt-2 flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setEnergy(n)}
                  className={cn(
                    "h-10 w-10 border-2 border-black text-[14px] font-bold transition",
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
        </div>

        <div className="sticky bottom-0 border-t-2 border-black bg-white px-5 py-3 safe-bottom">
          <button
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 bg-black px-4 py-3 text-[14px] font-bold uppercase tracking-wider text-white transition hover:bg-[var(--acid)] hover:text-black"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              "Save journal"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
