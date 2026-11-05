import "server-only";

import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { exercises, sets, workouts } from "@/db/schema";
import type { WorkoutInput } from "@/lib/validation/workout";

export class UnknownExerciseError extends Error {
  constructor() {
    super("One or more exercises don't exist.");
    this.name = "UnknownExerciseError";
  }
}

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Maps each entry to an exercise id, creating exercises for new names. A new
 * name that matches an existing exercise (case-insensitively) reuses it, via
 * the lower(name) unique index, so this is also safe against concurrent saves.
 */
async function resolveExerciseIds(
  tx: Transaction,
  userId: string,
  entries: WorkoutInput["exercises"],
): Promise<string[]> {
  const ids = [
    ...new Set(entries.flatMap((e) => (e.exerciseId ? [e.exerciseId] : []))),
  ];
  if (ids.length > 0) {
    // Checked up front for a clear error rather than a mid-insert FK failure.
    const found = await tx
      .select({ id: exercises.id })
      .from(exercises)
      .where(inArray(exercises.id, ids));
    if (found.length !== ids.length) throw new UnknownExerciseError();
  }

  const newNames = new Map<string, string>(); // lower(name) -> name
  for (const e of entries) {
    if (e.newExerciseName) {
      const key = e.newExerciseName.toLowerCase();
      if (!newNames.has(key)) newNames.set(key, e.newExerciseName);
    }
  }
  const idByName = new Map<string, string>();
  if (newNames.size > 0) {
    await tx
      .insert(exercises)
      .values(
        [...newNames.values()].map((name) => ({ name, createdBy: userId })),
      )
      .onConflictDoNothing();
    const rows = await tx
      .select({ id: exercises.id, name: exercises.name })
      .from(exercises)
      .where(inArray(sql`lower(${exercises.name})`, [...newNames.keys()]));
    for (const row of rows) idByName.set(row.name.toLowerCase(), row.id);
  }

  return entries.map((e) => {
    const id =
      e.exerciseId ?? idByName.get(e.newExerciseName?.toLowerCase() ?? "");
    if (!id) throw new UnknownExerciseError();
    return id;
  });
}

/**
 * Saves a workout and its sets in one transaction, creating any new exercises
 * it names.
 *
 * `userId` must come from requireUser(), never from request input.
 * `input` must already be validated with workoutInputSchema.
 */
export async function createWorkout(
  userId: string,
  input: WorkoutInput,
): Promise<{ id: string }> {
  return db.transaction(async (tx) => {
    const exerciseIds = await resolveExerciseIds(tx, userId, input.exercises);

    const [workout] = await tx
      .insert(workouts)
      .values({
        userId,
        performedOn: input.performedOn,
        notes: input.notes || null,
      })
      .returning({ id: workouts.id });

    // Ordering is derived from array order, never accepted from the client.
    // set_number counts per exercise, so a repeated exercise continues 4, 5...
    const nextSetNumber = new Map<string, number>();
    const rows = input.exercises.flatMap((entry, entryIndex) =>
      entry.sets.map((set) => {
        const exerciseId = exerciseIds[entryIndex];
        const setNumber = (nextSetNumber.get(exerciseId) ?? 0) + 1;
        nextSetNumber.set(exerciseId, setNumber);
        return {
          workoutId: workout.id,
          exerciseId,
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
  performedOn: string; // YYYY-MM-DD
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

/**
 * The user's most recent workouts, newest first, with exercises in logged
 * order.
 *
 * `userId` must come from requireUser(): this filter is the access rule.
 */
export async function listWorkoutsForUser(
  userId: string,
  { limit = 20 }: { limit?: number } = {},
): Promise<WorkoutSummary[]> {
  const workoutRows = await db
    .select({
      id: workouts.id,
      performedOn: workouts.performedOn,
      notes: workouts.notes,
    })
    .from(workouts)
    .where(eq(workouts.userId, userId))
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
    .where(
      inArray(
        sets.workoutId,
        workoutRows.map((w) => w.id),
      ),
    )
    .orderBy(asc(sets.exercisePosition), asc(sets.setNumber));

  // Rows are sorted by position, then set number, so appending preserves order.
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

  return workoutRows.map((w) => ({
    ...w,
    exercises: byWorkout.get(w.id) ?? [],
  }));
}
