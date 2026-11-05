"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  issuesByPath,
  type WorkoutFormState,
  workoutInputSchema,
} from "@/lib/validation/workout";
import { anthropicWorkoutModel } from "@/lib/workout-parser/anthropic-model";
import {
  type ParsedExercise,
  parseWorkoutText,
} from "@/lib/workout-parser/parse";
import { getAnthropic } from "@/server/anthropic";
import { requireUser } from "@/server/auth";
import { listExercises } from "@/server/exercises";
import { createWorkout, UnknownExerciseError } from "@/server/workouts";

// `input` is `unknown`: Server Actions are public endpoints, so Zod decides.
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
      return {
        error: "One of the exercises no longer exists. Reload and try again.",
      };
    }
    console.error("createWorkout failed", err);
    return { error: "Couldn't save your workout. Please try again." };
  }

  redirect("/workouts");
}

// No `cause`: parser failures can carry API error details, which stay in logs.
export type ParseWorkoutResponse =
  | {
      ok: true;
      exercises: ParsedExercise[];
      notes: string | null;
      warnings: string[];
    }
  | { ok: false; error: string };

export async function parseWorkoutAction(
  text: unknown,
): Promise<ParseWorkoutResponse> {
  await requireUser();

  // A loose cap on the payload; the parser enforces the real limit with a
  // friendlier message.
  const parsed = z.string().max(10_000).safeParse(text);
  if (!parsed.success) return { ok: false, error: "Describe your workout." };

  const catalog = await listExercises();
  const result = await parseWorkoutText(parsed.data, {
    // Resolved inside the call so a missing key is handled like any API error.
    model: (input, names) =>
      anthropicWorkoutModel(getAnthropic())(input, names),
    catalog,
  });

  if (!result.ok) {
    if (result.cause) {
      console.error(`parseWorkoutText failed (${result.reason})`, result.cause);
    }
    return { ok: false, error: result.error };
  }
  return result;
}
