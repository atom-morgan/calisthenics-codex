import { eq, sql } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exercises, sets, users, workouts } from "@/db/schema";
import { createAuthUser, resetDb } from "@/test/db";
import { db } from "@/test/mock-db";
import {
  createWorkout,
  listWorkoutsForUser,
  UnknownExerciseError,
} from "./workouts";

vi.mock("@/db", () => import("@/test/mock-db"));

let athleteId: string;
let pullUpId: string;
let dipId: string;

beforeEach(async () => {
  await resetDb(db);
  athleteId = await createAuthUser(db, "athlete@example.com", {
    name: "Ana",
  });
  const rows = await db
    .insert(exercises)
    .values([{ name: "Pull-up" }, { name: "Dip" }])
    .returning({ id: exercises.id, name: exercises.name });
  pullUpId = rows.find((r) => r.name === "Pull-up")!.id;
  dipId = rows.find((r) => r.name === "Dip")!.id;
});

describe("profile trigger", () => {
  it("creates a profile from signup metadata", async () => {
    const [profile] = await db
      .select()
      .from(users)
      .where(eq(users.id, athleteId));
    expect(profile).toMatchObject({
      email: "athlete@example.com",
      name: "Ana",
      role: "athlete",
    });
  });

  it("falls back to the email's local part for a blank name", async () => {
    const id = await createAuthUser(db, "sam.lee@example.com", {
      name: "  ",
    });
    const [profile] = await db.select().from(users).where(eq(users.id, id));
    expect(profile.name).toBe("sam.lee");
  });
});

describe("createWorkout", () => {
  const savedSets = async (workoutId: string) =>
    db
      .select({
        exerciseId: sets.exerciseId,
        position: sets.exercisePosition,
        setNumber: sets.setNumber,
        reps: sets.reps,
      })
      .from(sets)
      .where(eq(sets.workoutId, workoutId))
      .orderBy(sets.exercisePosition, sets.setNumber);

  it("numbers positions by entry and sets per exercise", async () => {
    const { id } = await createWorkout(athleteId, {
      performedOn: "2026-11-05",
      exercises: [
        { exerciseId: pullUpId, sets: [{ reps: 8 }, { reps: 6 }] },
        { exerciseId: dipId, sets: [{ reps: 10 }] },
        { exerciseId: pullUpId, sets: [{ reps: 5 }] },
      ],
    });
    expect(await savedSets(id)).toEqual([
      { exerciseId: pullUpId, position: 1, setNumber: 1, reps: 8 },
      { exerciseId: pullUpId, position: 1, setNumber: 2, reps: 6 },
      { exerciseId: dipId, position: 2, setNumber: 1, reps: 10 },
      // A repeated exercise continues its set count.
      { exerciseId: pullUpId, position: 3, setNumber: 3, reps: 5 },
    ]);
  });

  it("rejects an unknown exercise and writes nothing", async () => {
    await expect(
      createWorkout(athleteId, {
        performedOn: "2026-11-05",
        exercises: [
          {
            exerciseId: "00000000-0000-4000-8000-000000000000",
            sets: [{ reps: 1 }],
          },
        ],
      }),
    ).rejects.toBeInstanceOf(UnknownExerciseError);
    expect(await db.select().from(workouts)).toHaveLength(0);
  });

  it("finds or creates exercises by name, case-insensitively", async () => {
    const { id } = await createWorkout(athleteId, {
      performedOn: "2026-11-05",
      exercises: [
        { newExerciseName: "pull-UP", sets: [{ reps: 3 }] },
        { newExerciseName: "Archer pull-up", sets: [{ reps: 2 }] },
        { newExerciseName: "ARCHER PULL-UP", sets: [{ reps: 1 }] },
      ],
    });
    const created = await db
      .select()
      .from(exercises)
      .where(sql`lower(${exercises.name}) = 'archer pull-up'`);
    expect(created).toHaveLength(1);
    expect(created[0].createdBy).toBe(athleteId);

    const saved = await savedSets(id);
    expect(saved[0].exerciseId).toBe(pullUpId);
    expect(saved.slice(1).map((s) => s.exerciseId)).toEqual([
      created[0].id,
      created[0].id,
    ]);
  });
});

describe("listWorkoutsForUser", () => {
  it("returns only the given user's workouts", async () => {
    const otherId = await createAuthUser(db, "other@example.com");
    await createWorkout(athleteId, {
      performedOn: "2026-11-04",
      exercises: [{ exerciseId: pullUpId, sets: [{ reps: 8 }] }],
    });
    await createWorkout(otherId, {
      performedOn: "2026-11-05",
      exercises: [{ exerciseId: dipId, sets: [{ reps: 10 }] }],
    });

    const mine = await listWorkoutsForUser(athleteId);
    expect(mine).toHaveLength(1);
    expect(mine[0].exercises[0].name).toBe("Pull-up");
  });
});
