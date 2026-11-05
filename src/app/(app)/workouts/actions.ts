"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth";
import { createWorkout, UnknownExerciseError } from "@/server/workouts";
import {
  issuesByPath,
  type WorkoutFormState,
  workoutInputSchema,
} from "@/lib/validation/workout";

// Takes a plain object instead of FormData: Server Actions accept any
// serializable argument. It's typed `unknown` on purpose, since anyone can
// call this endpoint with anything, so Zod decides what it is.
export async function createWorkoutAction(
  _prev: WorkoutFormState,
  input: unknown,
): Promise<WorkoutFormState> {
  const user = await requireUser();

  const parsed = workoutInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      issues: issuesByPath(parsed.error),
    };
  }

  try {
    await createWorkout(user.id, parsed.data);
  } catch (err) {
    if (err instanceof UnknownExerciseError) {
      return { error: "One of the exercises no longer exists. Reload and try again." };
    }
    console.error("createWorkout failed", err);
    return { error: "Couldn't save your workout. Please try again." };
  }

  // Outside the try/catch: redirect() works by throwing.
  redirect("/workouts");
}
