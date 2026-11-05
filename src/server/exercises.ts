import "server-only";

import { asc } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";

export type ExerciseOption = { id: string; name: string };

// Exercises are shared across users, so there's no per-user filter.
export async function listExercises(): Promise<ExerciseOption[]> {
  return db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .orderBy(asc(exercises.name));
}
