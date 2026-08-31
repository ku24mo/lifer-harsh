"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { saveQuote } from "@/lib/data";

interface Props {
  date: string;
  initialQuote: string | null;
}

export function QuoteField({ date, initialQuote }: Props) {
  const [value, setValue] = useState(initialQuote ?? "");
  const [saved, setSaved] = useState(false);
  const [savedValue, setSavedValue] = useState(initialQuote ?? "");

  useEffect(() => {
    setValue(initialQuote ?? "");
    setSavedValue(initialQuote ?? "");
  }, [initialQuote]);

  const handleSave = async () => {
    if (value === savedValue) return;
    await saveQuote(date, value);
    setSavedValue(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/40">
        Today's one-liner
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        placeholder="set the tone…"
        rows={2}
        className="mt-2 w-full resize-none bg-transparent text-[22px] sm:text-[26px] font-bold leading-tight tracking-tight text-black placeholder:text-black/20 placeholder:font-normal outline-none"
      />
      <div className="mt-1 flex items-center justify-end">
        {saved && (
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-black animate-fade-in">
            <Check className="h-3 w-3" /> saved
          </span>
        )}
      </div>
    </div>
  );
}
