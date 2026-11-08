import "server-only";

import { and, count, countDistinct, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, sets, workouts } from "@/db/schema";
import { bestSetSeries, type ProgressSeries } from "@/lib/progress";

export type LoggedExercise = { id: string; name: string; workoutCount: number };

// `userId` in this file must be the signed-in user's id from requireUser(), or
// an athlete id returned by a coach access check (listAthleteWorkoutsForCoach).

/** Exercises the user has logged, most-logged first. */
export async function listLoggedExercises(
  userId: string,
): Promise<LoggedExercise[]> {
  return db
    .select({
      id: exercises.id,
      name: exercises.name,
      workoutCount: countDistinct(workouts.id),
    })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .innerJoin(exercises, eq(exercises.id, sets.exerciseId))
    .where(eq(workouts.userId, userId))
    .groupBy(exercises.id)
    .orderBy(desc(count(sets.id)), exercises.name);
}

/** The user's best set per day for one exercise. */
export async function getExerciseProgress(
  userId: string,
  exerciseId: string,
): Promise<ProgressSeries> {
  const rows = await db
    .select({
      performedOn: workouts.performedOn,
      reps: sets.reps,
      durationSec: sets.durationSec,
      addedWeightLb: sets.addedWeightLb,
    })
    .from(sets)
    .innerJoin(workouts, eq(workouts.id, sets.workoutId))
    .where(and(eq(workouts.userId, userId), eq(sets.exerciseId, exerciseId)));
  return bestSetSeries(rows);
}
