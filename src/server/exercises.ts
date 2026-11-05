import "server-only";

import { asc } from "drizzle-orm";
import { db } from "@/db";
import { exercises } from "@/db/schema";

export type ExerciseOption = { id: string; name: string };

// The exercise list is shared by all users (seeded, plus user-created on Day 2),
// so there's no per-user filter. Callers still require a logged-in user.
export async function listExercises(): Promise<ExerciseOption[]> {
  return db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .orderBy(asc(exercises.name));
}
