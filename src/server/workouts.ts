import "server-only";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { exercises, sets, workouts } from "@/db/schema";
import type { WorkoutInput } from "@/lib/validation/workout";

export class UnknownExerciseError extends Error {
  constructor() {
    super("One or more exercises don't exist.");
    this.name = "UnknownExerciseError";
  }
}

// Saves a workout and all its sets for `userId`. The caller must pass the id of
// the logged-in user (from requireUser()), never an id from request input.
// `input` must already be validated with workoutInputSchema.
//
// Runs in one transaction: either the workout and every set are saved, or
// nothing is.
export async function createWorkout(
  userId: string,
  input: WorkoutInput,
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    // Check exercise ids up front for a clear error, instead of relying on the
    // foreign key to fail halfway through the insert.
    const exerciseIds = [...new Set(input.exercises.map((e) => e.exerciseId))];
    const found = await tx
      .select({ id: exercises.id })
      .from(exercises)
      .where(inArray(exercises.id, exerciseIds));
    if (found.length !== exerciseIds.length) throw new UnknownExerciseError();

    const [workout] = await tx
      .insert(workouts)
      .values({
        userId,
        performedOn: input.performedOn,
        notes: input.notes || null,
      })
      .returning({ id: workouts.id });

    // Ordering is assigned here from array order, never taken from the client:
    // - exercise_position: which block (1 = first exercise logged).
    // - set_number: counts per exercise, so if the same exercise appears in
    //   two blocks, numbering continues (1, 2, 3, then 4, 5).
    const nextSetNumber = new Map<string, number>();
    const rows = input.exercises.flatMap((entry, entryIndex) =>
      entry.sets.map((set) => {
        const setNumber = (nextSetNumber.get(entry.exerciseId) ?? 0) + 1;
        nextSetNumber.set(entry.exerciseId, setNumber);
        return {
          workoutId: workout.id,
          exerciseId: entry.exerciseId,
          exercisePosition: entryIndex + 1,
          setNumber,
          reps: set.reps ?? null,
          durationSec: set.durationSec ?? null,
          addedWeightLb: set.addedWeightLb ?? null,
        };
      }),
    );
    await tx.insert(sets).values(rows);

    return { id: workout.id };
  });
}

export type WorkoutSummary = {
  id: string;
  performedOn: string; // "YYYY-MM-DD"
  notes: string | null;
  exercises: {
    position: number;
    name: string;
    sets: {
      setNumber: number;
      reps: number | null;
      durationSec: number | null;
      addedWeightLb: number | null;
    }[];
  }[];
};

// The latest workouts for `userId`, newest first, each with its exercises in
// the order they were logged. As with createWorkout, `userId` must come from
// requireUser(), never from request input: this filter IS the access rule.
//
// Two queries instead of one per workout (the "N+1" problem): first the
// workouts, then every set for those workouts in one go, grouped in memory.
export async function listWorkoutsForUser(
  userId: string,
  { limit = 20 }: { limit?: number } = {},
): Promise<WorkoutSummary[]> {
  const workoutRows = await db
    .select({ id: workouts.id, performedOn: workouts.performedOn, notes: workouts.notes })
    .from(workouts)
    .where(eq(workouts.userId, userId))
    // createdAt breaks ties when two workouts share a date.
    .orderBy(desc(workouts.performedOn), desc(workouts.createdAt))
    .limit(limit);

  if (workoutRows.length === 0) return [];

  const setRows = await db
    .select({
      workoutId: sets.workoutId,
      position: sets.exercisePosition,
      name: exercises.name,
      setNumber: sets.setNumber,
      reps: sets.reps,
      durationSec: sets.durationSec,
      addedWeightLb: sets.addedWeightLb,
    })
    .from(sets)
    .innerJoin(exercises, eq(exercises.id, sets.exerciseId))
    .where(inArray(sets.workoutId, workoutRows.map((w) => w.id)))
    .orderBy(asc(sets.exercisePosition), asc(sets.setNumber));

  // Rows arrive sorted by position then set number, so pushing in order keeps
  // both the exercise order and the set order.
  const byWorkout = new Map<string, WorkoutSummary["exercises"]>();
  for (const { workoutId, position, name, ...set } of setRows) {
    const blocks = byWorkout.get(workoutId) ?? [];
    let block = blocks.find((b) => b.position === position);
    if (!block) {
      block = { position, name, sets: [] };
      blocks.push(block);
    }
    block.sets.push(set);
    byWorkout.set(workoutId, blocks);
  }

  return workoutRows.map((w) => ({ ...w, exercises: byWorkout.get(w.id) ?? [] }));
}
