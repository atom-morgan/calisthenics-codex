import { describe, expect, it } from "vitest";
import {
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

  it("does not mutate the previous state", () => {
    const before = initial();
    const snapshot = structuredClone(before);
    exercisesReducer(before, { type: "addSet", exerciseKey: "e1", key: "s2" });
    exercisesReducer(before, { type: "removeExercise", exerciseKey: "e1" });
    expect(before).toEqual(snapshot);
  });
});

describe("toWorkoutInput", () => {
  it("converts strings to numbers and blanks to undefined", () => {
    const drafts: ExerciseDraft[] = [
      {
        key: "e1",
        exerciseId: "pull-up",
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
        sets: [{ key: "s1", reps: "abc", durationSec: "", addedWeightLb: "" }],
      },
    ];
    expect(
      toWorkoutInput("2026-11-04", "", drafts).exercises[0].sets[0].reps,
    ).toBeNaN();
  });
});
