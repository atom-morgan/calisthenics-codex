import { beforeEach, describe, expect, it, vi } from "vitest";
import { exercises } from "@/db/schema";
import { createAuthUser, resetDb } from "@/test/db";
import { db } from "@/test/mock-db";
import { getExerciseProgress, listLoggedExercises } from "./progress";
import { createWorkout } from "./workouts";

vi.mock("@/db", () => import("@/test/mock-db"));

let anaId: string;
let benId: string;
let pullUpId: string;
let dipId: string;

beforeEach(async () => {
  await resetDb(db);
  anaId = await createAuthUser(db, "ana@example.com");
  benId = await createAuthUser(db, "ben@example.com");
  const rows = await db
    .insert(exercises)
    .values([{ name: "Pull-up" }, { name: "Dip" }])
    .returning({ id: exercises.id, name: exercises.name });
  pullUpId = rows.find((r) => r.name === "Pull-up")!.id;
  dipId = rows.find((r) => r.name === "Dip")!.id;

  const log = (
    userId: string,
    performedOn: string,
    exerciseId: string,
    reps: number[],
  ) =>
    createWorkout(userId, {
      performedOn,
      exercises: [{ exerciseId, sets: reps.map((r) => ({ reps: r })) }],
    });
  await log(anaId, "2026-11-01", pullUpId, [6, 5]);
  await log(anaId, "2026-11-04", pullUpId, [8, 7]);
  await log(anaId, "2026-11-04", dipId, [10]);
  // Ben's numbers must never appear in Ana's results.
  await log(benId, "2026-11-04", pullUpId, [20]);
  await log(benId, "2026-11-05", pullUpId, [21]);
});

describe("listLoggedExercises", () => {
  it("lists only the user's exercises, most-logged first", async () => {
    expect(await listLoggedExercises(anaId)).toEqual([
      { id: pullUpId, name: "Pull-up", workoutCount: 2 },
      { id: dipId, name: "Dip", workoutCount: 1 },
    ]);
  });
});

describe("getExerciseProgress", () => {
  it("returns only the user's best sets", async () => {
    expect(await getExerciseProgress(anaId, pullUpId)).toEqual({
      metric: "reps",
      points: [
        { date: "2026-11-01", value: 6 },
        { date: "2026-11-04", value: 8 },
      ],
    });
  });

  it("is empty for an exercise the user never logged", async () => {
    const otherId = await createAuthUser(db, "cy@example.com");
    expect((await getExerciseProgress(otherId, pullUpId)).points).toEqual([]);
  });
});
