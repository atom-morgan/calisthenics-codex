import { describe, expect, it, vi } from "vitest";
import {
  type CatalogExercise,
  interpretModelOutput,
  MAX_INPUT_LENGTH,
  parseWorkoutText,
  type WorkoutModel,
} from "./parse";

const catalog: CatalogExercise[] = [
  { id: "id-pull-up", name: "Pull-up" },
  { id: "id-dip", name: "Dip" },
  { id: "id-l-sit", name: "L-sit" },
];

const set = (
  reps: number | null,
  durationSec: number | null = null,
  addedWeightLb: number | null = null,
) => ({ reps, durationSec, addedWeightLb });

const entry = (
  heard: string,
  exercise: string | null,
  sets: ReturnType<typeof set>[],
) => ({ heard, exercise, sets });

// A model that returns canned output, so tests check our handling of it.
const returning =
  (output: unknown): WorkoutModel =>
  async () =>
    output;

function parse(text: string, model: WorkoutModel) {
  return parseWorkoutText(text, { model, catalog });
}

describe("parseWorkoutText", () => {
  it("parses shorthand like “pullups 8/8/6”", async () => {
    const result = await parse(
      "pullups 8/8/6",
      returning({
        exercises: [entry("pullups", "Pull-up", [set(8), set(8), set(6)])],
        notes: null,
        unparsed: [],
      }),
    );
    // toStrictEqual: sets must not carry keys set to undefined.
    expect(result).toStrictEqual({
      ok: true,
      exercises: [
        {
          heard: "pullups",
          exerciseId: "id-pull-up",
          name: "Pull-up",
          sets: [{ reps: 8 }, { reps: 8 }, { reps: 6 }],
        },
      ],
      notes: null,
      warnings: [],
    });
  });

  it("asks for sets when none were given (“did some dips”)", async () => {
    const result = await parse(
      "did some dips",
      returning({
        exercises: [entry("dips", "Dip", [])],
        notes: null,
        unparsed: [],
      }),
    );
    expect(result).toMatchObject({
      ok: true,
      exercises: [{ exerciseId: "id-dip", sets: [] }],
      warnings: ["Add your sets for Dip."],
    });
  });

  it.each([
    ["an empty string", ""],
    ["whitespace", "   \n "],
  ])("rejects %s without calling the model", async (_label, text) => {
    const model = vi.fn<WorkoutModel>();
    const result = await parse(text, model);
    expect(result).toMatchObject({ ok: false, reason: "empty" });
    expect(model).not.toHaveBeenCalled();
  });

  it("rejects input over the length limit without calling the model", async () => {
    const model = vi.fn<WorkoutModel>();
    const result = await parse("x".repeat(MAX_INPUT_LENGTH + 1), model);
    expect(result).toMatchObject({ ok: false, reason: "too_long" });
    expect(model).not.toHaveBeenCalled();
  });

  it("sends trimmed text and the catalog names to the model", async () => {
    const model = vi.fn<WorkoutModel>().mockResolvedValue({
      exercises: [entry("dips", "Dip", [set(10)])],
      notes: null,
      unparsed: [],
    });
    await parse("  dips x10 \n", model);
    expect(model).toHaveBeenCalledWith("dips x10", ["Pull-up", "Dip", "L-sit"]);
  });

  it("reports nonsense as no exercises found", async () => {
    const result = await parse(
      "asdf qwerty",
      returning({ exercises: [], notes: null, unparsed: ["asdf qwerty"] }),
    );
    expect(result).toMatchObject({ ok: false, reason: "no_exercises" });
  });

  it("turns a model error (API failure, timeout, refusal) into a friendly message", async () => {
    const cause = new Error("Request timed out.");
    const result = await parse("3x8 pull-ups", async () => {
      throw cause;
    });
    expect(result).toEqual({
      ok: false,
      reason: "model_error",
      error:
        "Couldn't parse that. Try rephrasing, or fill in the form yourself.",
      cause,
    });
  });
});

describe("interpretModelOutput", () => {
  it.each([
    ["null", null],
    ["a string", "3x8 pull-ups"],
    ["a missing field", { exercises: [] }],
    [
      "a wrong type",
      { exercises: [entry("pullups", "Pull-up", [])], notes: 3, unparsed: [] },
    ],
  ])("rejects malformed output: %s", (_label, raw) => {
    expect(interpretModelOutput(raw, catalog)).toMatchObject({
      ok: false,
      reason: "invalid_output",
    });
  });

  it("rejects an exercise name that isn't in the catalog", () => {
    const raw = {
      exercises: [entry("muscle ups", "Muscle-up", [set(3)])],
      notes: null,
      unparsed: [],
    };
    expect(interpretModelOutput(raw, catalog)).toMatchObject({
      ok: false,
      reason: "invalid_output",
    });
  });

  it("keeps an unmatched exercise and warns", () => {
    const raw = {
      exercises: [entry("archer pushups", null, [set(5)])],
      notes: null,
      unparsed: [],
    };
    expect(interpretModelOutput(raw, catalog)).toEqual({
      ok: true,
      exercises: [
        {
          heard: "archer pushups",
          exerciseId: null,
          name: null,
          sets: [{ reps: 5 }],
        },
      ],
      notes: null,
      warnings: [
        "“archer pushups” isn't in the exercise list. Pick one, or add it as new.",
      ],
    });
  });

  it("keeps holds and added weight", () => {
    const raw = {
      exercises: [
        entry("l-sit", "L-sit", [set(null, 30)]),
        entry("weighted pullups", "Pull-up", [set(5, null, 22.5)]),
      ],
      notes: null,
      unparsed: [],
    };
    const result = interpretModelOutput(raw, catalog);
    expect(result.ok && result.exercises.map((e) => e.sets)).toEqual([
      [{ durationSec: 30 }],
      [{ reps: 5, addedWeightLb: 22.5 }],
    ]);
  });

  it.each([
    ["decimal reps", set(2.5)],
    ["zero reps", set(0)],
    ["a set with no reps or hold", set(null)],
    ["negative weight", set(5, null, -10)],
    ["absurd reps", set(100000)],
  ])("drops a set with %s and warns", (_label, badSet) => {
    const raw = {
      exercises: [entry("pullups", "Pull-up", [set(8), badSet])],
      notes: null,
      unparsed: [],
    };
    const result = interpretModelOutput(raw, catalog);
    expect(result).toMatchObject({
      ok: true,
      exercises: [{ sets: [{ reps: 8 }] }],
      warnings: ["Skipped a set for Pull-up that didn't look right."],
    });
  });

  it("surfaces text it couldn't interpret", () => {
    const raw = {
      exercises: [entry("dips", "Dip", [set(10)])],
      notes: null,
      unparsed: ["qwerty", "  "],
    };
    expect(interpretModelOutput(raw, catalog)).toMatchObject({
      ok: true,
      warnings: ["Didn't understand “qwerty”."],
    });
  });

  it("returns comments as trimmed notes", () => {
    const raw = {
      exercises: [entry("dips", "Dip", [set(10)])],
      notes: "  felt tired ",
      unparsed: [],
    };
    expect(interpretModelOutput(raw, catalog)).toMatchObject({
      ok: true,
      notes: "felt tired",
      warnings: [],
    });
  });

  it("caps the number of sets", () => {
    const raw = {
      exercises: [
        entry(
          "dips",
          "Dip",
          Array.from({ length: 60 }, () => set(1)),
        ),
      ],
      notes: null,
      unparsed: [],
    };
    const result = interpretModelOutput(raw, catalog);
    expect(result.ok && result.exercises[0].sets).toHaveLength(50);
  });
});
