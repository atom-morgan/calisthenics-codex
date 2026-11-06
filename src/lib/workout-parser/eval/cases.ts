import type { SetInput } from "@/lib/validation/workout";

export type EvalCase = {
  input: string;
  /** Expected exercises in order; `name: null` means "not in the catalog". */
  expect:
    | { exercises: { name: string | null; sets: SetInput[] }[]; notes?: true }
    | { noExercises: true };
};

const reps = (...counts: number[]) => counts.map((n) => ({ reps: n }));
const holds = (...secs: number[]) => secs.map((n) => ({ durationSec: n }));
const times = <T>(n: number, value: T) =>
  Array.from({ length: n }, () => value);

export const EVAL_CASES: EvalCase[] = [
  {
    input: "pullups 8/8/6",
    expect: { exercises: [{ name: "Pull-up", sets: reps(8, 8, 6) }] },
  },
  {
    input: "3x10 dips",
    expect: { exercises: [{ name: "Dip", sets: reps(10, 10, 10) }] },
  },
  {
    input: "3 sets of 5 chin ups, 2x12 push ups",
    expect: {
      exercises: [
        { name: "Chin-up", sets: reps(5, 5, 5) },
        { name: "Push-up", sets: reps(12, 12) },
      ],
    },
  },
  {
    input: "plank 60s, hollow hold 3x30s",
    expect: {
      exercises: [
        { name: "Plank", sets: holds(60) },
        { name: "Hollow body hold", sets: holds(30, 30, 30) },
      ],
    },
  },
  {
    input: "l-sit 1:30",
    expect: { exercises: [{ name: "L-sit", sets: holds(90) }] },
  },
  {
    input: "front lever 5x10s, muscle ups x3",
    expect: {
      exercises: [
        { name: "Front lever", sets: holds(10, 10, 10, 10, 10) },
        { name: "Muscle-up", sets: reps(3) },
      ],
    },
  },
  {
    input: "weighted pull-ups +20lb 5/5/5",
    expect: {
      exercises: [
        { name: "Pull-up", sets: times(3, { reps: 5, addedWeightLb: 20 }) },
      ],
    },
  },
  {
    input: "dips with 10kg 3x8",
    expect: {
      exercises: [
        { name: "Dip", sets: times(3, { reps: 8, addedWeightLb: 22 }) },
      ],
    },
  },
  {
    input: "HSPU 3x3",
    expect: { exercises: [{ name: "Handstand push-up", sets: reps(3, 3, 3) }] },
  },
  {
    input: "did some dips",
    expect: { exercises: [{ name: "Dip", sets: [] }] },
  },
  {
    input: "pistols 5/side, 3x5 each leg lunges",
    expect: {
      exercises: [
        { name: "Pistol squat", sets: reps(5) },
        { name: "Lunge", sets: reps(5, 5, 5) },
      ],
    },
  },
  {
    input: "archer pushups 6 per arm",
    expect: { exercises: [{ name: "Archer push-up", sets: reps(6) }] },
  },
  {
    input: "diamond pushups 3x10",
    expect: { exercises: [{ name: null, sets: reps(10, 10, 10) }] },
  },
  {
    input: "pullups 8, 8, 6 - felt strong, 2 min rest between sets",
    expect: {
      exercises: [{ name: "Pull-up", sets: reps(8, 8, 6) }],
      notes: true,
    },
  },
  // Ladders and repeated sequences. The first is a real user's entry.
  {
    input: "overhead press 3 rounds of 2, 3, 5 ladders",
    expect: {
      exercises: [{ name: null, sets: reps(2, 3, 5, 2, 3, 5, 2, 3, 5) }],
    },
  },
  {
    input: "pullup ladder 1-2-3-4-5",
    expect: { exercises: [{ name: "Pull-up", sets: reps(1, 2, 3, 4, 5) }] },
  },
  {
    input: "chin ups 2x 1-2-3 ladder",
    expect: { exercises: [{ name: "Chin-up", sets: reps(1, 2, 3, 1, 2, 3) }] },
  },
  {
    input: "dips 4,6,8 x2",
    expect: { exercises: [{ name: "Dip", sets: reps(4, 6, 8, 4, 6, 8) }] },
  },
  {
    input: "asdf qwerty",
    expect: { noExercises: true },
  },
];
