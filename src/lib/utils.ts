import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Local date key YYYY-MM-DD in the user's timezone. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD key into a local Date at midnight. */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday-based start of week for a given date. */
export function startOfWeek(d: Date = new Date()): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  date.setDate(date.getDate() + diff);
  return date;
}

/** Add days to a date. */
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Minutes since midnight for a "HH:MM" string. */
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Current minutes since midnight (local). */
export function nowMinutes(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Format minutes since midnight as "h:mm am/pm". */
export function formatTime(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? "pm" : "am";
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

/** Format a duration in seconds as "H:MM:SS" or "MM:SS". */
export function formatDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  return `${m}:${String(ss).padStart(2, "0")}`;
}

/** Percentage 0..100, clamped. */
export function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((num / den) * 100)));
}
