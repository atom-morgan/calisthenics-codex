import { describe, expect, it } from "vitest";
import { workoutInputSchema } from "@/lib/validation/workout";
import { buildDemoAthletes, sessionDates } from "./demo-data";

const today = new Date("2026-11-07T12:00:00Z"); // a Saturday

describe("sessionDates", () => {
  it("returns Mon/Wed/Fri for eight weeks, oldest first, never in the future", () => {
    const dates = sessionDates(today);
    expect(dates).toHaveLength(24);
    expect(dates[0]).toBe("2026-09-14");
    expect(dates.at(-1)).toBe("2026-11-06");
    expect([...dates].sort()).toEqual(dates);
  });

  it("stops at today mid-week", () => {
    const wednesday = new Date("2026-11-04T12:00:00Z");
    expect(sessionDates(wednesday).at(-1)).toBe("2026-11-04");
  });
});

describe("buildDemoAthletes", () => {
  const athletes = buildDemoAthletes(today);

  it("is deterministic", () => {
    expect(buildDemoAthletes(today)).toEqual(athletes);
  });

  it("produces workouts the app would accept", () => {
    for (const athlete of athletes) {
      expect(athlete.workouts.length).toBeGreaterThan(15);
      for (const workout of athlete.workouts) {
        // Names stand in for ids; the seed script resolves them.
        const input = {
          ...workout,
          exercises: workout.exercises.map((e) => ({
            exerciseId: "6f1c2a8e-4b7d-4e3a-9c5f-1d2e3f4a5b6c",
            sets: e.sets,
          })),
        };
        expect(workoutInputSchema.safeParse(input).success).toBe(true);
      }
    }
  });

  it("shows progress: later top sets beat early ones", () => {
    const maya = athletes.find((a) => a.key === "maya")!;
    const topPullUp = (i: number) =>
      maya.workouts[i].exercises.find((e) => e.name === "Pull-up")!.sets[0]
        .reps!;
    expect(topPullUp(maya.workouts.length - 1)).toBeGreaterThan(topPullUp(0));
  });
});
