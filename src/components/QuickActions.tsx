"use client";

import { useState, useEffect, useCallback } from "react";
import { JournalModal } from "./JournalModal";
import { StickyNotes } from "./StickyNotes";
import { fetchDayBundle, fetchStickyNotes } from "@/lib/data-client";
import { dateKey } from "@/lib/utils";
import type { DayRow, BlockCompletionRow, StickyNoteRow } from "@/lib/types";

/**
 * Global quick-action handler — mounted in the root layout.
 * Listens for "dr-open-journal" and "dr-open-sticky" events from the bottom bar
 * and opens modals regardless of which page the user is on.
 * Always operates on today's date.
 */
export function QuickActions() {
  const [showJournal, setShowJournal] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [day, setDay] = useState<DayRow | null>(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  const today = dateKey(new Date());

  const loadToday = useCallback(async () => {
    const [bundle, notes] = await Promise.all([
      fetchDayBundle(today),
      fetchStickyNotes(today),
    ]);
    setDay(bundle.day);
    setStickyNotes(notes);
    setLoaded(true);
  }, [today]);

  useEffect(() => {
    const onOpenJournal = () => {
      if (!loaded) loadToday();
      setShowJournal(true);
    };
    const onOpenSticky = () => {
      if (!loaded) loadToday();
      setShowSticky(true);
    };
    window.addEventListener("dr-open-journal", onOpenJournal);
    window.addEventListener("dr-open-sticky", onOpenSticky);
    return () => {
      window.removeEventListener("dr-open-journal", onOpenJournal);
      window.removeEventListener("dr-open-sticky", onOpenSticky);
    };
  }, [loaded, loadToday]);

  // Refresh data when journal closes
  const handleJournalClose = useCallback(() => {
    setShowJournal(false);
    loadToday();
  }, [loadToday]);

  // Refresh data when sticky panel closes
  const handleStickyClose = useCallback(() => {
    setShowSticky(false);
    loadToday();
  }, [loadToday]);

  return (
    <>
      {showJournal && (
        <JournalModal
          date={today}
          initialFree={day?.journal_free ?? null}
          initialEnergy={day?.energy ?? null}
          onClose={handleJournalClose}
        />
      )}

      {showSticky && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-md max-h-[80dvh] overflow-y-auto bg-white border-2 border-black safe-bottom p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold uppercase tracking-wider text-black">
                Today's notes
              </h2>
              <button
                onClick={handleStickyClose}
                className="text-[11px] font-bold uppercase tracking-wider text-black/40 hover:text-black"
              >
                close
              </button>
            </div>
            <StickyNotes
              date={today}
              notes={stickyNotes}
              onAddingChange={() => {}}
            />
          </div>
        </div>
      )}
    </>
  );
}
