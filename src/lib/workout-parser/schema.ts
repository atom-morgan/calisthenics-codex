import { z } from "zod";

/**
 * The shape the model must return. Deliberately loose (no ranges): the SDK
 * validates this schema client-side and throws on any mismatch, which would
 * discard the whole response over one bad set. Values are checked per set
 * afterwards in `interpretModelOutput`.
 */
export function modelOutputSchema(exerciseNames: string[]) {
  const match =
    exerciseNames.length > 0
      ? z.enum(exerciseNames as [string, ...string[]]).nullable()
      : z.null();

  return z.object({
    exercises: z.array(
      z.object({
        heard: z.string().describe("The exercise as the user wrote it."),
        exercise: match.describe(
          "The same exercise from the list, or null if none matches.",
        ),
        sets: z.array(
          z.object({
            reps: z.number().nullable(),
            durationSec: z.number().nullable(),
            addedWeightLb: z.number().nullable(),
          }),
        ),
      }),
    ),
    notes: z
      .string()
      .nullable()
      .describe("Comments about the workout, in the user's words, or null."),
    unparsed: z
      .array(z.string())
      .describe("Parts of the text that are neither sets nor comments."),
  });
}

export type ModelOutput = z.infer<ReturnType<typeof modelOutputSchema>>;
