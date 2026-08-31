export interface DayRow {
  date: string;
  quote: string | null;
  journal_answers: Record<string, string> | null;
  journal_free: string | null;
  energy: number | null;
  steps: number | null;
  screen_time_min: number | null;
  sleep_hours: number | null;
}

export interface BlockCompletionRow {
  id: string;
  date: string;
  block_key: string;
  intention: string | null;
  outcome: string | null;
  completed: boolean;
  completed_at: string | null;
  timer_seconds: number;
  timer_running: boolean;
  timer_started_at: string | null;
}

export interface WeeklyReviewRow {
  week_start: string;
  wins: string | null;
  slips: string | null;
  next_week_focus: string | null;
}

export interface StickyNoteRow {
  id: string;
  date: string;
  content: string;
  color: string; // acid | black | yellow | white
  pinned: boolean;
}

export const JOURNAL_PROMPTS = [
  { key: "needle", question: "What moved the needle today?" },
  { key: "slip", question: "Where did I slip, and why?" },
  { key: "lesson", question: "One lesson from today" },
  { key: "tomorrow", question: "Top priority for tomorrow" },
] as const;
