import type { SetInput, WorkoutInput } from "@/lib/validation/workout";

type Exercise = { name: string; sets: SetInput[] };
type DemoWorkout = Omit<WorkoutInput, "exercises"> & { exercises: Exercise[] };

export type DemoAthlete = {
  key: string;
  name: string;
  email: string;
  workouts: DemoWorkout[];
};

export const DEMO_COACH = {
  name: "Coach Riley",
  email: "riley.coach@demo.calisthenics-codex.app",
};

const WEEKS = 8;
const SESSION_DAYS = [0, 2, 4]; // Mon, Wed, Fri

/** Small deterministic PRNG (mulberry32) so every run seeds identical data. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

/** Session dates for the last WEEKS weeks, oldest first, never after `today`. */
export function sessionDates(today: Date): string[] {
  const end = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const monday = new Date(end);
  monday.setUTCDate(end.getUTCDate() - ((end.getUTCDay() + 6) % 7));
  monday.setUTCDate(monday.getUTCDate() - 7 * (WEEKS - 1));

  const dates: string[] = [];
  for (let week = 0; week < WEEKS; week++) {
    for (const offset of SESSION_DAYS) {
      const day = new Date(monday);
      day.setUTCDate(monday.getUTCDate() + week * 7 + offset);
      if (day <= end) dates.push(isoDay(day));
    }
  }
  return dates;
}

/**
 * A value that climbs from `start` to `end` over the program (0..1), with a
 * little day-to-day noise, rounded to `step`.
 */
function progress(
  t: number,
  start: number,
  end: number,
  random: () => number,
  step = 1,
) {
  const noise = (random() - 0.5) * (end - start) * 0.15;
  return Math.max(
    step,
    Math.round((start + (end - start) * t + noise) / step) * step,
  );
}

/** Descending sets from a top set, e.g. 9 -> 9, 8, 7. */
const pyramid = (top: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ reps: Math.max(1, top - i) }));

const repeat = <T>(count: number, value: T) =>
  Array.from({ length: count }, () => value);

type Program = (t: number, session: number, random: () => number) => Exercise[];

const PROGRAMS: Record<string, Program> = {
  maya: (t, session, r) => [
    { name: "Pull-up", sets: pyramid(progress(t, 6, 10, r), 3) },
    session % 2 === 0
      ? {
          name: "Dip",
          sets: repeat(3, {
            reps: 6,
            addedWeightLb: progress(t, 10, 25, r, 2.5),
          }),
        }
      : {
          name: "Pistol squat",
          sets: repeat(3, { reps: progress(t, 3, 6, r) }),
        },
    { name: "L-sit", sets: repeat(3, { durationSec: progress(t, 15, 30, r) }) },
  ],
  jordan: (t, session, r) => [
    session % 2 === 0
      ? {
          name: "Inverted row",
          sets: repeat(3, { reps: progress(t, 8, 12, r) }),
        }
      : { name: "Pull-up", sets: pyramid(progress(t, 1, 4, r), 2) },
    { name: "Push-up", sets: pyramid(progress(t, 12, 20, r), 3) },
    { name: "Squat", sets: repeat(3, { reps: 15 }) },
    { name: "Plank", sets: [{ durationSec: progress(t, 30, 60, r, 5) }] },
  ],
  sam: (t, session, r) => [
    { name: "Muscle-up", sets: repeat(4, { reps: progress(t, 2, 5, r) }) },
    session % 2 === 0
      ? {
          name: "Pull-up",
          sets: repeat(3, {
            reps: 5,
            addedWeightLb: progress(t, 25, 45, r, 5),
          }),
        }
      : {
          name: "Handstand push-up",
          sets: pyramid(progress(t, 3, 6, r), 3),
        },
    {
      name: "Front lever",
      sets: repeat(4, { durationSec: progress(t, 5, 12, r) }),
    },
  ],
};

const NOTES = [
  "Felt strong",
  "Short on sleep",
  "Long rest between sets",
  "Great session",
];

export function buildDemoAthletes(today: Date): DemoAthlete[] {
  const dates = sessionDates(today);
  const athletes = [
    { key: "maya", name: "Maya Chen", seed: 11 },
    { key: "jordan", name: "Jordan Ellis", seed: 23 },
    { key: "sam", name: "Sam Okafor", seed: 37 },
  ];

  return athletes.map(({ key, name, seed }) => {
    const random = rng(seed);
    const program = PROGRAMS[key];
    // Skip roughly one session in eight, like real life.
    const workouts = dates.flatMap((performedOn, session) => {
      if (session > 0 && random() < 0.12) return [];
      const t = dates.length > 1 ? session / (dates.length - 1) : 1;
      return [
        {
          performedOn,
          notes:
            random() < 0.25
              ? NOTES[Math.floor(random() * NOTES.length)]
              : undefined,
          exercises: program(t, session, random),
        },
      ];
    });
    return {
      key,
      name,
      email: `${key}@demo.calisthenics-codex.app`,
      workouts,
    };
  });
}
