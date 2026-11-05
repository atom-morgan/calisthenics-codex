import { type SetInput, setInputSchema } from "@/lib/validation/workout";
import { modelOutputSchema } from "./schema";

export const MAX_INPUT_LENGTH = 1000;
const MAX_EXERCISES = 30;
const MAX_SETS = 50;

export type CatalogExercise = { id: string; name: string };

export type ParsedExercise = {
  heard: string;
  /** null when the exercise isn't in the catalog. */
  exerciseId: string | null;
  name: string | null;
  sets: SetInput[];
};

export type ParseFailureReason =
  "empty" | "too_long" | "model_error" | "invalid_output" | "no_exercises";

export type ParseResult =
  | {
      ok: true;
      exercises: ParsedExercise[];
      notes: string | null;
      warnings: string[];
    }
  | {
      ok: false;
      reason: ParseFailureReason;
      error: string;
      /** For server logs only; never send to the client. */
      cause?: unknown;
    };

/** Sends the text to a model and resolves to its raw, unvalidated output. */
export type WorkoutModel = (
  text: string,
  exerciseNames: string[],
) => Promise<unknown>;

const FAILED =
  "Couldn't parse that. Try rephrasing, or fill in the form yourself.";

export async function parseWorkoutText(
  text: string,
  { model, catalog }: { model: WorkoutModel; catalog: CatalogExercise[] },
): Promise<ParseResult> {
  const trimmed = text.trim();
  if (trimmed === "") {
    return {
      ok: false,
      reason: "empty",
      error: "Describe your workout first.",
    };
  }
  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {
      ok: false,
      reason: "too_long",
      error: `Keep it under ${MAX_INPUT_LENGTH} characters.`,
    };
  }

  let raw: unknown;
  try {
    raw = await model(
      trimmed,
      catalog.map((e) => e.name),
    );
  } catch (cause) {
    return { ok: false, reason: "model_error", error: FAILED, cause };
  }
  return interpretModelOutput(raw, catalog);
}

/**
 * Validates raw model output and maps it onto the catalog. Never trusts the
 * model: shape, exercise names, and every set value are checked here, and
 * anything unusable becomes a warning instead of a form value.
 */
export function interpretModelOutput(
  raw: unknown,
  catalog: CatalogExercise[],
): ParseResult {
  const parsed = modelOutputSchema(catalog.map((e) => e.name)).safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_output",
      error: FAILED,
      cause: parsed.error,
    };
  }

  const byName = new Map(catalog.map((e) => [e.name.toLowerCase(), e]));
  const warnings: string[] = [];
  let entries = parsed.data.exercises;

  if (entries.length === 0) {
    return {
      ok: false,
      reason: "no_exercises",
      error:
        "Couldn't find any exercises in that. Try something like “3x8 pull-ups”.",
    };
  }
  if (entries.length > MAX_EXERCISES) {
    warnings.push(`Only the first ${MAX_EXERCISES} exercises were kept.`);
    entries = entries.slice(0, MAX_EXERCISES);
  }

  const exercises = entries.map((entry): ParsedExercise => {
    const match = entry.exercise
      ? byName.get(entry.exercise.toLowerCase())
      : undefined;
    const heard = entry.heard.trim() || entry.exercise || "Unknown exercise";
    const label = match?.name ?? `“${heard}”`;

    if (!match) {
      warnings.push(
        `${label} isn't in the exercise list, so it will be added as a new exercise. Pick one from the list if it's already there.`,
      );
    }

    const sets: SetInput[] = [];
    let skipped = 0;
    for (const set of entry.sets) {
      // Drop nulls rather than mapping them to undefined: Zod keeps keys that
      // are present, and `{ reps: 8, durationSec: undefined }` would leak into
      // the draft and fail strict equality.
      const present = Object.fromEntries(
        Object.entries(set).filter(([, value]) => value !== null),
      );
      const result = setInputSchema.safeParse(present);
      if (result.success) sets.push(result.data);
      else skipped++;
    }
    if (skipped > 0) {
      warnings.push(
        `Skipped ${skipped === 1 ? "a set" : `${skipped} sets`} for ${label} that didn't look right.`,
      );
    }
    if (sets.length > MAX_SETS) {
      warnings.push(`Only the first ${MAX_SETS} sets for ${label} were kept.`);
      sets.length = MAX_SETS;
    }
    if (sets.length === 0) {
      warnings.push(`Add your sets for ${label}.`);
    }

    return {
      heard,
      exerciseId: match?.id ?? null,
      name: match?.name ?? null,
      sets,
    };
  });

  for (const fragment of parsed.data.unparsed) {
    if (fragment.trim())
      warnings.push(`Didn't understand “${fragment.trim()}”.`);
  }

  const notes = parsed.data.notes?.trim() || null;
  return { ok: true, exercises, notes, warnings };
}
