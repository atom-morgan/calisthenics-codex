// Runs the parser against real models. Costs a few cents per model; not part
// of `npm test`. Usage: npm run eval:parser -- [model ...]
import { isDeepStrictEqual } from "node:util";
import Anthropic from "@anthropic-ai/sdk";
import { SEED_EXERCISES } from "@/db/seed-exercises";
import {
  anthropicWorkoutModel,
  DEFAULT_PARSER_MODEL,
} from "@/lib/workout-parser/anthropic-model";
import { type ParseResult, parseWorkoutText } from "@/lib/workout-parser/parse";
import { type EvalCase, EVAL_CASES } from "./cases";

const CONCURRENCY = 4;
const catalog = SEED_EXERCISES.map((name) => ({ id: name, name }));

/** Returns a description of the mismatch, or null if the result is correct. */
function check(expect: EvalCase["expect"], result: ParseResult): string | null {
  if ("noExercises" in expect) {
    return !result.ok && result.reason === "no_exercises"
      ? null
      : `expected no exercises, got ${summarize(result)}`;
  }
  if (!result.ok) return `expected exercises, got ${summarize(result)}`;

  const actual = result.exercises.map((e) => ({ name: e.name, sets: e.sets }));
  if (!isDeepStrictEqual(actual, expect.exercises)) {
    return `expected ${JSON.stringify(expect.exercises)}\n      got      ${JSON.stringify(actual)}`;
  }
  if (expect.notes && !result.notes) return "expected notes, got none";
  return null;
}

function summarize(result: ParseResult) {
  return result.ok
    ? JSON.stringify(result.exercises.map((e) => [e.name ?? e.heard, e.sets]))
    : `${result.reason}${result.cause ? ` (${String(result.cause)})` : ""}`;
}

async function mapLimited<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

async function evaluate(client: Anthropic, modelId: string) {
  const model = anthropicWorkoutModel(client, modelId);
  const runs = await mapLimited(EVAL_CASES, CONCURRENCY, async (c) => {
    const start = performance.now();
    const result = await parseWorkoutText(c.input, { model, catalog });
    return {
      c,
      ms: performance.now() - start,
      failure: check(c.expect, result),
    };
  });

  console.log(`\n${modelId}`);
  for (const { c, ms, failure } of runs) {
    const time = `${(ms / 1000).toFixed(1)}s`.padStart(5);
    console.log(`  ${failure ? "✗" : "✓"} ${time}  ${c.input}`);
    if (failure) console.log(`      ${failure}`);
  }
  const passed = runs.filter((r) => !r.failure).length;
  const sorted = runs.map((r) => r.ms).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] / 1000;
  console.log(
    `  ${passed}/${runs.length} passed, median ${median.toFixed(1)}s`,
  );
  return passed === runs.length;
}

async function main() {
  const models = process.argv.slice(2);
  const client = new Anthropic({ timeout: 30_000, maxRetries: 1 });
  let allPassed = true;
  for (const modelId of models.length ? models : [DEFAULT_PARSER_MODEL]) {
    allPassed = (await evaluate(client, modelId)) && allPassed;
  }
  if (!allPassed) process.exitCode = 1;
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
