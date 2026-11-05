import type { WorkoutInput } from "@/lib/validation/workout";

// Drafts hold raw input strings; they're converted to numbers on submit.
export type SetField = "reps" | "durationSec" | "addedWeightLb";
export type SetDraft = { key: string } & Record<SetField, string>;
export type ExerciseDraft = {
  key: string;
  exerciseId: string;
  sets: SetDraft[];
};

// Keys for new rows come in with the action so the reducer stays pure.
export type ExercisesAction =
  | { type: "addExercise"; key: string; setKey: string }
  | { type: "removeExercise"; exerciseKey: string }
  | { type: "selectExercise"; exerciseKey: string; exerciseId: string }
  | { type: "addSet"; exerciseKey: string; key: string }
  | { type: "removeSet"; exerciseKey: string; setKey: string }
  | {
      type: "updateSet";
      exerciseKey: string;
      setKey: string;
      field: SetField;
      value: string;
    };

const emptySet = (key: string): SetDraft => ({
  key,
  reps: "",
  durationSec: "",
  addedWeightLb: "",
});

export const emptyExercise = (key: string, setKey: string): ExerciseDraft => ({
  key,
  exerciseId: "",
  sets: [emptySet(setKey)],
});

function updateExercise(
  exercises: ExerciseDraft[],
  exerciseKey: string,
  update: (exercise: ExerciseDraft) => ExerciseDraft,
) {
  return exercises.map((e) => (e.key === exerciseKey ? update(e) : e));
}

export function exercisesReducer(
  exercises: ExerciseDraft[],
  action: ExercisesAction,
): ExerciseDraft[] {
  switch (action.type) {
    case "addExercise":
      return [...exercises, emptyExercise(action.key, action.setKey)];

    case "removeExercise":
      return exercises.filter((e) => e.key !== action.exerciseKey);

    case "selectExercise":
      return updateExercise(exercises, action.exerciseKey, (e) => ({
        ...e,
        exerciseId: action.exerciseId,
      }));

    case "addSet":
      return updateExercise(exercises, action.exerciseKey, (e) => {
        // New sets copy the previous one; most people repeat their numbers.
        const last = e.sets.at(-1);
        const set = last ? { ...last, key: action.key } : emptySet(action.key);
        return { ...e, sets: [...e.sets, set] };
      });

    case "removeSet":
      return updateExercise(exercises, action.exerciseKey, (e) => ({
        ...e,
        sets: e.sets.filter((s) => s.key !== action.setKey),
      }));

    case "updateSet":
      return updateExercise(exercises, action.exerciseKey, (e) => ({
        ...e,
        sets: e.sets.map((s) =>
          s.key === action.setKey ? { ...s, [action.field]: action.value } : s,
        ),
      }));
  }
}

// Blank -> undefined. Invalid input becomes NaN, which Zod rejects.
const toNumber = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

export function toWorkoutInput(
  performedOn: string,
  notes: string,
  exercises: ExerciseDraft[],
): WorkoutInput {
  return {
    performedOn,
    notes,
    exercises: exercises.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets.map((s) => ({
        reps: toNumber(s.reps),
        durationSec: toNumber(s.durationSec),
        addedWeightLb: toNumber(s.addedWeightLb),
      })),
    })),
  };
}
