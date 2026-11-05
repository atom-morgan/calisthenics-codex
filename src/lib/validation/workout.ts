import { z } from "zod";

// Shared by the form (for types) and the Server Action (for validation).
// The Day 2 LLM parser will reuse the set shape too.

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
  // Mirrors the sets_reps_or_duration check constraint in the database, so the
  // user gets a friendly message instead of a constraint error.
  .refine((s) => s.reps !== undefined || s.durationSec !== undefined, {
    message: "Enter reps or a hold time.",
  });

export const exerciseEntrySchema = z.object({
  exerciseId: z.uuid("Choose an exercise."),
  sets: z.array(setInputSchema).min(1, "Add at least one set.").max(50),
});

// Tomorrow in UTC: the latest date that can be "today" somewhere on Earth.
// The browser picks the user's local date, so we allow a day of slack.
function latestAllowedDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const workoutInputSchema = z.object({
  performedOn: z.iso
    .date("Enter a valid date.")
    // ISO dates (YYYY-MM-DD) compare correctly as strings.
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

// What the Server Action sends back to the form on failure. `issues` is keyed
// by the field's path, e.g. "exercises.0.sets.1" or "performedOn".
export type WorkoutFormState = {
  error?: string;
  issues?: Record<string, string>;
};

// Turns Zod issues into { "exercises.0.sets.1": "Enter reps or a hold time." }.
// Keeps the first message per field.
export function issuesByPath(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    result[key] ??= issue.message;
  }
  return result;
}
