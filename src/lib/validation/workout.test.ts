import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { issuesByPath, workoutInputSchema } from "./workout";

const EXERCISE_ID = "6f1c2a8e-4b7d-4e3a-9c5f-1d2e3f4a5b6c";

function workout(overrides: Record<string, unknown> = {}) {
  return {
    performedOn: "2026-11-04",
    exercises: [{ exerciseId: EXERCISE_ID, sets: [{ reps: 8 }] }],
    ...overrides,
  };
}

function withSet(set: Record<string, unknown>) {
  return workout({ exercises: [{ exerciseId: EXERCISE_ID, sets: [set] }] });
}

function issues(input: unknown) {
  const result = workoutInputSchema.safeParse(input);
  if (result.success) throw new Error("expected validation to fail");
  return issuesByPath(result.error);
}

describe("workoutInputSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-04T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("accepts a valid workout", () => {
    const result = workoutInputSchema.safeParse(
      workout({
        notes: "Felt strong",
        exercises: [
          {
            exerciseId: EXERCISE_ID,
            sets: [
              { reps: 8 },
              { durationSec: 30 },
              { reps: 5, addedWeightLb: 22.5 },
            ],
          },
        ],
      }),
    );
    expect(result.success).toBe(true);
  });

  it("trims notes", () => {
    const parsed = workoutInputSchema.parse(
      workout({ notes: "  short rest  " }),
    );
    expect(parsed.notes).toBe("short rest");
  });

  it("requires at least one exercise", () => {
    expect(issues(workout({ exercises: [] }))).toEqual({
      exercises: "Add at least one exercise.",
    });
  });

  it("requires an exercise to be chosen", () => {
    const input = workout({
      exercises: [{ exerciseId: "", sets: [{ reps: 8 }] }],
    });
    expect(issues(input)).toEqual({
      "exercises.0.exerciseId": "Choose an exercise.",
    });
  });

  it("requires at least one set per exercise", () => {
    const input = workout({
      exercises: [{ exerciseId: EXERCISE_ID, sets: [] }],
    });
    expect(issues(input)).toEqual({
      "exercises.0.sets": "Add at least one set.",
    });
  });

  it("requires reps or a hold time on each set", () => {
    expect(issues(withSet({ addedWeightLb: 10 }))).toEqual({
      "exercises.0.sets.0": "Enter reps or a hold time.",
    });
  });

  it.each([
    ["decimal reps", { reps: 2.5 }, "exercises.0.sets.0.reps"],
    ["zero reps", { reps: 0 }, "exercises.0.sets.0.reps"],
    ["negative hold", { durationSec: -5 }, "exercises.0.sets.0.durationSec"],
    [
      "negative weight",
      { reps: 5, addedWeightLb: -10 },
      "exercises.0.sets.0.addedWeightLb",
    ],
    // What the form sends for unparseable input.
    ["NaN reps", { reps: Number.NaN }, "exercises.0.sets.0.reps"],
  ])("rejects %s", (_name, set, path) => {
    expect(Object.keys(issues(withSet(set)))).toContain(path);
  });

  it("rejects malformed dates", () => {
    expect(issues(workout({ performedOn: "11/04/2026" }))).toEqual({
      performedOn: "Enter a valid date.",
    });
  });

  it("allows tomorrow (UTC) to cover timezones ahead of the server", () => {
    expect(
      workoutInputSchema.safeParse(workout({ performedOn: "2026-11-05" }))
        .success,
    ).toBe(true);
  });

  it("rejects dates further in the future", () => {
    expect(issues(workout({ performedOn: "2026-11-06" }))).toEqual({
      performedOn: "Date can't be in the future.",
    });
  });

  it("rejects non-object input", () => {
    expect(workoutInputSchema.safeParse("3x8 pull-ups").success).toBe(false);
    expect(workoutInputSchema.safeParse(null).success).toBe(false);
  });
});

describe("issuesByPath", () => {
  it("keys issues by path and keeps the first message per field", () => {
    const input = workout({
      exercises: [
        { exerciseId: EXERCISE_ID, sets: [{ reps: 8 }, {}] },
        { exerciseId: "", sets: [{ reps: 1.5 }] },
      ],
    });
    expect(issues(input)).toEqual({
      "exercises.0.sets.1": "Enter reps or a hold time.",
      "exercises.1.exerciseId": "Choose an exercise.",
      "exercises.1.sets.0.reps": "Reps must be a whole number.",
    });
  });
});
