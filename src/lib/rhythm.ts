export type BlockType = "personal" | "work" | "meal" | "gym";
export type SectionKey = "morning" | "work" | "evening";
export type AccentColor = "amber" | "orange" | "emerald";

export interface RhythmBlock {
  key: string;
  /** Start time "HH:MM" (24h, local). */
  start: string;
  /** End time "HH:MM" (24h, local). */
  end: string;
  label: string;
  type: BlockType;
  /** Whether this block has a countdown timer. */
  timer: boolean;
  /** Days of week this block applies to (0=Sun..6=Sat). Omit = every day. */
  days?: number[];
  /** Which dashboard section this block belongs to. */
  section: SectionKey;
}

/**
 * Harsh's fixed daily rhythm.
 * Times are local (IST). Gym is Mon-Fri only.
 */
export const RHYTHM: RhythmBlock[] = [
  {
    key: "wake",
    start: "06:30",
    end: "07:15",
    label: "Wake, walk + Jim Rohn podcast",
    type: "personal",
    timer: false,
    section: "morning",
  },
  {
    key: "workout",
    start: "07:15",
    end: "07:50",
    label: "Coffee, 50 push-ups / 20 pull-ups / 5 squats",
    type: "personal",
    timer: false,
    section: "morning",
  },
  {
    key: "shower",
    start: "07:50",
    end: "08:00",
    label: "Shower / get ready",
    type: "personal",
    timer: false,
    section: "morning",
  },
  {
    key: "kickoff",
    start: "08:00",
    end: "08:15",
    label: "Daily kickoff — Sales Navigator, today's targets",
    type: "work",
    timer: false,
    section: "work",
  },
  {
    key: "work_1",
    start: "08:15",
    end: "10:00",
    label: "Work Block 1",
    type: "work",
    timer: true,
    section: "work",
  },
  {
    key: "breakfast",
    start: "10:00",
    end: "10:30",
    label: "Break fast (first meal)",
    type: "meal",
    timer: false,
    section: "work",
  },
  {
    key: "work_2",
    start: "10:30",
    end: "13:00",
    label: "Work Block 2",
    type: "work",
    timer: true,
    section: "work",
  },
  {
    key: "lunch",
    start: "13:00",
    end: "14:00",
    label: "Lunch",
    type: "meal",
    timer: false,
    section: "work",
  },
  {
    key: "work_3",
    start: "14:00",
    end: "15:30",
    label: "Work Block 3",
    type: "work",
    timer: true,
    section: "work",
  },
  {
    key: "work_4",
    start: "15:30",
    end: "17:00",
    label: "Work Block 4",
    type: "work",
    timer: true,
    section: "work",
  },
  {
    key: "finish",
    start: "17:00",
    end: "17:30",
    label: "Finish work",
    type: "personal",
    timer: false,
    section: "work",
  },
  {
    key: "gym",
    start: "17:30",
    end: "19:00",
    label: "Gym",
    type: "gym",
    timer: true,
    days: [1, 2, 3, 4, 5], // Mon-Fri
    section: "evening",
  },
  {
    key: "dinner",
    start: "19:00",
    end: "20:00",
    label: "Dinner",
    type: "meal",
    timer: false,
    section: "evening",
  },
];

export interface SectionDef {
  key: SectionKey;
  label: string;
  subtitle: string;
  accent: AccentColor;
  /** Block keys in order. */
  blockKeys: string[];
}

export const SECTIONS: SectionDef[] = [
  {
    key: "morning",
    label: "Morning Ritual",
    subtitle: "Wake · Move · Ready",
    accent: "amber",
    blockKeys: ["wake", "workout", "shower"],
  },
  {
    key: "work",
    label: "Deep Work",
    subtitle: "4 focus blocks · GTM",
    accent: "orange",
    blockKeys: [
      "kickoff",
      "work_1",
      "breakfast",
      "work_2",
      "lunch",
      "work_3",
      "work_4",
      "finish",
    ],
  },
  {
    key: "evening",
    label: "Evening",
    subtitle: "Train · Refuel",
    accent: "emerald",
    blockKeys: ["gym", "dinner"],
  },
];

export const SECTION_ACCENTS: Record<
  AccentColor,
  {
    text: string;
    bg: string;
    border: string;
    gradient: string;
    glow: string;
    dot: string;
    bar: string;
    ring: string;
  }
> = {
  amber: {
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200/60",
    gradient: "from-amber-50 via-orange-50/40 to-transparent",
    glow: "shadow-amber-200/30",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    ring: "ring-amber-300/40",
  },
  orange: {
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200/60",
    gradient: "from-orange-50 via-amber-50/40 to-transparent",
    glow: "shadow-orange-200/30",
    dot: "bg-orange-500",
    bar: "bg-orange-500",
    ring: "ring-orange-300/40",
  },
  emerald: {
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200/60",
    gradient: "from-emerald-50 via-teal-50/40 to-transparent",
    glow: "shadow-emerald-200/30",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    ring: "ring-emerald-300/40",
  },
};

/** Blocks applicable for a given weekday (0=Sun..6=Sat). */
export function blocksForDay(weekday: number): RhythmBlock[] {
  return RHYTHM.filter((b) => !b.days || b.days.includes(weekday));
}

/** Block duration in minutes. */
export function blockDurationMin(b: RhythmBlock): number {
  const [sh, sm] = b.start.split(":").map(Number);
  const [eh, em] = b.end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/** Block duration in seconds. */
export function blockDurationSec(b: RhythmBlock): number {
  return blockDurationMin(b) * 60;
}

