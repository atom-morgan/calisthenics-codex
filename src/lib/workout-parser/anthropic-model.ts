import type Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { WorkoutModel } from "./parse";
import { systemPrompt } from "./prompt";
import { modelOutputSchema } from "./schema";

export const DEFAULT_PARSER_MODEL = "claude-haiku-5-5";

/**
 * A `WorkoutModel` backed by the Messages API with structured output. Throws
 * on API errors, refusals, and truncated or non-conforming output; callers
 * treat any throw as "couldn't parse".
 */
export function anthropicWorkoutModel(
  client: Anthropic,
  model: string = DEFAULT_PARSER_MODEL,
): WorkoutModel {
  return async (text, exerciseNames) => {
    const response = await client.messages.parse({
      model,
      max_tokens: 8000,
      output_config: {
        effort: "low",
        format: zodOutputFormat(modelOutputSchema(exerciseNames)),
      },
      system: systemPrompt(exerciseNames),
      messages: [{ role: "user", content: `<workout>\n${text}\n</workout>` }],
    });
    if (response.stop_reason !== "end_turn") {
      throw new Error(`Unexpected stop_reason: ${response.stop_reason}`);
    }
    return response.parsed_output;
  };
}
