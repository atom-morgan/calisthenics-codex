import { z } from "zod";

export const setInputSchema = z
  .object({
    reps: z
      .number()
      .int("Reps must be a whole number.")
      .min(1)
      .max(1000)
      .optional(),
    durationSec: z
      .number()
      .int("Hold time must be whole seconds.")
      .min(1)
      .max(3600)
      .optional(),
    addedWeightLb: z.number().min(0).max(1000).optional(),
  })
  // Mirrors the sets_reps_or_duration DB constraint with a friendlier message.
  .refine((s) => s.reps !== undefined || s.durationSec !== undefined, {
    message: "Enter reps or a hold time.",
  });

/**
 * An entry names either an existing exercise (`exerciseId`) or one to create
 * on save (`newExerciseName`), never both.
 */
export const exerciseEntrySchema = z
  .object({
    exerciseId: z.uuid("Choose an exercise.").optional(),
    newExerciseName: z
      .string()
      .trim()
      .transform((name) => name.replace(/\s+/g, " "))
      .pipe(
        z
          .string()
          .min(1, "Name the new exercise.")
          .max(80, "Keep the name under 80 characters."),
      )
      .optional(),
    sets: z.array(setInputSchema).min(1, "Add at least one set.").max(50),
  })
  .refine(
    (e) => (e.exerciseId === undefined) !== (e.newExerciseName === undefined),
    { message: "Choose an exercise.", path: ["exerciseId"] },
  );

// Tomorrow in UTC: the latest date that's "today" in some timezone.
function latestAllowedDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const workoutInputSchema = z.object({
  performedOn: z.iso
    .date("Enter a valid date.")
    .refine((d) => d <= latestAllowedDate(), "Date can't be in the future."),
  notes: z
    .string()
    .trim()
    .max(2000, "Keep notes under 2000 characters.")
    .optional(),
  exercises: z
    .array(exerciseEntrySchema)
    .min(1, "Add at least one exercise.")
    .max(30),
});

export type SetInput = z.infer<typeof setInputSchema>;
export type WorkoutInput = z.infer<typeof workoutInputSchema>;

// `issues` is keyed by field path, e.g. "exercises.0.sets.1".
export type WorkoutFormState = {
  error?: string;
  issues?: Record<string, string>;
};

/** Maps Zod issues to { "exercises.0.sets.1": message }, first message wins. */
export function issuesByPath(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    result[key] ??= issue.message;
  }
  return result;
}
