import { describe, expect, it } from "vitest";
import {
  draftsFromParsed,
  emptyExercise,
  type ExerciseDraft,
  exercisesReducer,
  toWorkoutInput,
} from "./workout-draft";

const initial = (): ExerciseDraft[] => [emptyExercise("e1", "s1")];

describe("exercisesReducer", () => {
  it("adds an exercise with one empty set", () => {
    const state = exercisesReducer(initial(), {
      type: "addExercise",
      key: "e2",
      setKey: "s2",
    });
    expect(state).toHaveLength(2);
    expect(state[1]).toEqual(emptyExercise("e2", "s2"));
  });

  it("removes an exercise by key", () => {
    const two = exercisesReducer(initial(), {
      type: "addExercise",
      key: "e2",
      setKey: "s2",
    });
    const state = exercisesReducer(two, {
      type: "removeExercise",
      exerciseKey: "e1",
    });
    expect(state.map((e) => e.key)).toEqual(["e2"]);
  });

  it("selects an exercise", () => {
    const state = exercisesReducer(initial(), {
      type: "selectExercise",
      exerciseKey: "e1",
      exerciseId: "pull-up",
    });
    expect(state[0].exerciseId).toBe("pull-up");
  });

  it("updates a single field of a set", () => {
    const state = exercisesReducer(initial(), {
      type: "updateSet",
      exerciseKey: "e1",
      setKey: "s1",
      field: "reps",
      value: "8",
    });
    expect(state[0].sets[0]).toEqual({
      key: "s1",
      reps: "8",
      durationSec: "",
      addedWeightLb: "",
    });
  });

  it("copies the previous set's values when adding a set", () => {
    let state = exercisesReducer(initial(), {
      type: "updateSet",
      exerciseKey: "e1",
      setKey: "s1",
      field: "reps",
      value: "8",
    });
    state = exercisesReducer(state, {
      type: "addSet",
      exerciseKey: "e1",
      key: "s2",
    });
    expect(state[0].sets[1]).toEqual({ ...state[0].sets[0], key: "s2" });
  });

  it("removes a set by key, keeping the others in order", () => {
    let state = initial();
    state = exercisesReducer(state, {
      type: "addSet",
      exerciseKey: "e1",
      key: "s2",
    });
    state = exercisesReducer(state, {
      type: "addSet",
      exerciseKey: "e1",
      key: "s3",
    });
    state = exercisesReducer(state, {
      type: "removeSet",
      exerciseKey: "e1",
      setKey: "s2",
    });
    expect(state[0].sets.map((s) => s.key)).toEqual(["s1", "s3"]);
  });

  it("only changes the targeted exercise", () => {
    const two = exercisesReducer(initial(), {
      type: "addExercise",
      key: "e2",
      setKey: "s2",
    });
    const state = exercisesReducer(two, {
      type: "selectExercise",
      exerciseKey: "e2",
      exerciseId: "dip",
    });
    expect(state[0]).toBe(two[0]);
  });

  it("switches between a listed exercise and a new one", () => {
    const asNew = exercisesReducer(
      exercisesReducer(initial(), {
        type: "chooseNewExercise",
        exerciseKey: "e1",
      }),
      { type: "renameNewExercise", exerciseKey: "e1", name: "Archer pull-up" },
    );
    expect(asNew[0]).toMatchObject({
      exerciseId: "",
      newExerciseName: "Archer pull-up",
    });

    const listed = exercisesReducer(asNew, {
      type: "selectExercise",
      exerciseKey: "e1",
      exerciseId: "pull-up",
    });
    expect(listed[0]).toMatchObject({
      exerciseId: "pull-up",
      newExerciseName: null,
    });
  });

  it("appends parsed exercises, replacing only blank ones", () => {
    const parsed = emptyExercise("p1", "ps1");
    // e1 is blank and gets replaced; e2 has input and stays.
    const withInput = exercisesReducer(
      exercisesReducer(initial(), {
        type: "addExercise",
        key: "e2",
        setKey: "s2",
      }),
      {
        type: "updateSet",
        exerciseKey: "e2",
        setKey: "s2",
        field: "reps",
        value: "5",
      },
    );
    const state = exercisesReducer(withInput, {
      type: "appendParsed",
      exercises: [parsed],
    });
    expect(state.map((e) => e.key)).toEqual(["e2", "p1"]);
  });

  it("does not mutate the previous state", () => {
    const before = initial();
    const snapshot = structuredClone(before);
    exercisesReducer(before, { type: "addSet", exerciseKey: "e1", key: "s2" });
    exercisesReducer(before, { type: "removeExercise", exerciseKey: "e1" });
    expect(before).toEqual(snapshot);
  });
});

describe("draftsFromParsed", () => {
  const keys = () => {
    let n = 0;
    return () => `k${++n}`;
  };

  it("turns parsed sets into form strings", () => {
    const [draft] = draftsFromParsed(
      [
        {
          heard: "pullups",
          exerciseId: "pull-up",
          name: "Pull-up",
          sets: [{ reps: 5, addedWeightLb: 22.5 }, { durationSec: 30 }],
        },
      ],
      keys(),
    );
    expect(draft).toStrictEqual({
      key: "k1",
      exerciseId: "pull-up",
      newExerciseName: null,
      sets: [
        { key: "k2", reps: "5", durationSec: "", addedWeightLb: "22.5" },
        { key: "k3", reps: "", durationSec: "30", addedWeightLb: "" },
      ],
    });
  });

  it("starts unmatched exercises as new, named as heard, with an empty set", () => {
    const [draft] = draftsFromParsed(
      [{ heard: "diamond pushups", exerciseId: null, name: null, sets: [] }],
      keys(),
    );
    expect(draft).toMatchObject({
      exerciseId: "",
      newExerciseName: "Diamond pushups",
      sets: [{ reps: "", durationSec: "", addedWeightLb: "" }],
    });
  });
});

describe("toWorkoutInput", () => {
  it("sends a new exercise by name instead of id", () => {
    const drafts: ExerciseDraft[] = [
      {
        key: "e1",
        exerciseId: "",
        newExerciseName: "Archer pull-up",
        sets: [{ key: "s1", reps: "3", durationSec: "", addedWeightLb: "" }],
      },
    ];
    const [entry] = toWorkoutInput("2026-11-04", "", drafts).exercises;
    expect(entry).not.toHaveProperty("exerciseId");
    expect(entry.newExerciseName).toBe("Archer pull-up");
  });

  it("converts strings to numbers and blanks to undefined", () => {
    const drafts: ExerciseDraft[] = [
      {
        key: "e1",
        exerciseId: "pull-up",
        newExerciseName: null,
        sets: [
          { key: "s1", reps: "8", durationSec: "", addedWeightLb: "" },
          { key: "s2", reps: " ", durationSec: "30", addedWeightLb: "12.5" },
        ],
      },
    ];
    expect(toWorkoutInput("2026-11-04", "notes", drafts)).toEqual({
      performedOn: "2026-11-04",
      notes: "notes",
      exercises: [
        {
          exerciseId: "pull-up",
          sets: [
            { reps: 8, durationSec: undefined, addedWeightLb: undefined },
            { reps: undefined, durationSec: 30, addedWeightLb: 12.5 },
          ],
        },
      ],
    });
  });

  it("turns unparseable input into NaN for Zod to reject", () => {
    const drafts: ExerciseDraft[] = [
      {
        key: "e1",
        exerciseId: "pull-up",
        newExerciseName: null,
        sets: [{ key: "s1", reps: "abc", durationSec: "", addedWeightLb: "" }],
      },
    ];
    expect(
      toWorkoutInput("2026-11-04", "", drafts).exercises[0].sets[0].reps,
    ).toBeNaN();
  });
});
