export interface Exercise {
  key: string;
  name: string;
  sets: string;
  reps: string;
  cues: string;
}

export interface WorkoutDay {
  day: number; // 1=Mon..5=Fri
  title: string;
  subtitle: string;
  exercises: Exercise[];
  finisher: string;
}

export const WORKOUTS: Record<number, WorkoutDay> = {
  1: {
    day: 1,
    title: "Day 1 — Strength + Power",
    subtitle: "Olympic Lifter × Strongman",
    exercises: [
      { key: "squat", name: "Barbell Back Squat", sets: "5", reps: "5", cues: "Heavy, pyramid up each set" },
      { key: "ohp", name: "Barbell Overhead Press", sets: "4", reps: "5–6", cues: "Strict press, brace core like a plank" },
      { key: "rdl", name: "Barbell Romanian Deadlift", sets: "4", reps: "6–8", cues: "Slow eccentric, feel the hamstring load" },
      { key: "landmine_rot", name: "Barbell Landmine Rotation", sets: "4", reps: "15 each side", cues: "Wedge bar in corner, hips drive the rotation" },
      { key: "ring_pushup", name: "Gymnastics Ring Push-ups", sets: "3", reps: "8–10", cues: "Rings at chest height, full range, slow" },
      { key: "hip_thrust", name: "Hip Thrust (barbell loaded)", sets: "3", reps: "12–15", cues: "Neck tucked, drive through heels, squeeze at top" },
    ],
    finisher: "Barbell farmer's carry — 3 min up and down the room",
  },
  2: {
    day: 2,
    title: "Day 2 — Wrestling + Conditioning",
    subtitle: "Wrestler × Boxer",
    exercises: [
      { key: "power_clean", name: "Barbell Power Clean", sets: "5", reps: "3", cues: "Explosive pull — this is your boxing punch power" },
      { key: "split_squat", name: "Bulgarian Split Squat (barbell)", sets: "4", reps: "8 each leg", cues: "Bar on back, deep lunge, athletic stability" },
      { key: "ring_rows", name: "Gymnastics Ring Rows", sets: "4", reps: "10–12", cues: "Rings low, body angled, chest to rings" },
      { key: "nordic_curl", name: "Nordic Curl", sets: "3", reps: "5–7", cues: "Controlled descent, anchor feet under barbell" },
      { key: "upright_row", name: "EZ Bar Upright Row", sets: "3", reps: "12", cues: "Build the trap shelf, grip slightly wider than shoulder" },
      { key: "jump_squat", name: "Jump Squat (bodyweight)", sets: "3", reps: "15–20", cues: "Land soft, explode straight back up" },
      { key: "calf_raise", name: "Calf Raise (barbell on back)", sets: "3", reps: "20", cues: "Single-leg if easy" },
    ],
    finisher: "3 rounds — 45 sec high knees → 15 sec rest",
  },
  3: {
    day: 3,
    title: "Day 3 — Pull + Grip + Arms",
    subtitle: "Arm Wrestler × Gymnast × Back",
    exercises: [
      { key: "weighted_pullup", name: "Weighted Pull-ups", sets: "5", reps: "4–6", cues: "Dead hang start, chin clearly over bar" },
      { key: "bent_row", name: "Barbell Bent-Over Row", sets: "4", reps: "6–8", cues: "45° torso, bar to lower chest, pull elbows back" },
      { key: "muscle_up", name: "Gymnastics Ring Muscle-Up (or progression)", sets: "3", reps: "3–5", cues: "False grip for full MU, ring row → dip if not there yet" },
      { key: "ez_curl", name: "EZ Bar Curl (heavy)", sets: "4", reps: "6–8", cues: "Arm wrestling foundation, max tension at top" },
      { key: "hammer_curl", name: "Hammer Curl (DBs)", sets: "3", reps: "12", cues: "Brachialis and forearm, key arm wrestling muscle" },
      { key: "wrist_curl", name: "Barbell Wrist Curl + Reverse Wrist Curl", sets: "4", reps: "20", cues: "Seated, forearm on thigh, both directions" },
      { key: "shrug", name: "Barbell Shrug (heavy)", sets: "4", reps: "12–15", cues: "Hold 1 second at top, no rolling" },
    ],
    finisher: "Dead hang from pull-up bar — 3 × max time",
  },
  4: {
    day: 4,
    title: "Day 4 — Full Body + Core",
    subtitle: "Gymnast × Olympic Lifter × Boxer",
    exercises: [
      { key: "deadlift", name: "Barbell Deadlift", sets: "5", reps: "3–5", cues: "Max effort, your true strength test" },
      { key: "thruster", name: "Barbell Thruster (squat → press)", sets: "4", reps: "8–10", cues: "Fluid, squat drives the press, no pause" },
      { key: "ring_dips", name: "Gymnastics Ring Dips", sets: "3", reps: "8–10", cues: "Full lockout at top, control the descent" },
      { key: "landmine_press", name: "Barbell Landmine Press + Twist", sets: "3", reps: "20 each side", cues: "Wedge bar in corner, press and rotate — boxer's hook power" },
      { key: "lsit", name: "L-Sit Hold (dip handles)", sets: "3", reps: "max hold", cues: "Straight legs if possible, tucked to start" },
      { key: "hanging_curl", name: "Hanging leg curl", sets: "3", reps: "10–12", cues: "Extend slow, pull back with core" },
      { key: "neck", name: "Neck Work (plate, all directions)", sets: "3", reps: "15 each", cues: "Front, back, side — wrestler essential" },
    ],
    finisher: "Burpee → power clean ladder — 5, 4, 3, 2, 1 reps",
  },
  5: {
    day: 5,
    title: "Day 5 — Cardio",
    subtitle: "Running or Cycling",
    exercises: [
      { key: "cardio", name: "Running or Cycling", sets: "1", reps: "45 min", cues: "Steady state, zone 2-3, clear the mind" },
    ],
    finisher: "Stretch + foam roll",
  },
};

/** Get workout for a given weekday (0=Sun..6=Sat). Returns null for weekends. */
export function workoutForDay(weekday: number): WorkoutDay | null {
  // Convert JS weekday (0=Sun) to our day key (1=Mon..5=Fri)
  const dayKey = weekday === 0 ? 0 : weekday; // Sun=0, Mon=1..Fri=5, Sat=6
  return WORKOUTS[dayKey] ?? null;
}
