import type { WorkoutInput } from "@/lib/validation/workout";
import type { ParsedExercise } from "@/lib/workout-parser/parse";

// Drafts hold raw input strings; they're converted to numbers on submit.
export type SetField = "reps" | "durationSec" | "addedWeightLb";
export type SetDraft = { key: string } & Record<SetField, string>;
export type ExerciseDraft = {
  key: string;
  exerciseId: string;
  /** Non-null when the user is adding an exercise that isn't in the list. */
  newExerciseName: string | null;
  sets: SetDraft[];
};

// Keys for new rows come in with the action so the reducer stays pure.
export type ExercisesAction =
  | { type: "addExercise"; key: string; setKey: string }
  | { type: "removeExercise"; exerciseKey: string }
  | { type: "selectExercise"; exerciseKey: string; exerciseId: string }
  | { type: "chooseNewExercise"; exerciseKey: string }
  | { type: "renameNewExercise"; exerciseKey: string; name: string }
  // Replaces untouched blank exercises, keeps everything the user entered.
  | { type: "appendParsed"; exercises: ExerciseDraft[] }
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
  newExerciseName: null,
  sets: [emptySet(setKey)],
});

const isBlank = (e: ExerciseDraft) =>
  e.exerciseId === "" &&
  !e.newExerciseName &&
  e.sets.every((s) => !s.reps && !s.durationSec && !s.addedWeightLb);

const toField = (value: number | undefined) =>
  value === undefined ? "" : String(value);

/**
 * Turns parser output into drafts. Unmatched exercises start as new ones
 * named as the user wrote them; exercises without sets get one empty row.
 */
export function draftsFromParsed(
  parsed: ParsedExercise[],
  newKey: () => string,
): ExerciseDraft[] {
  return parsed.map((p) => ({
    key: newKey(),
    exerciseId: p.exerciseId ?? "",
    newExerciseName: p.exerciseId
      ? null
      : p.heard.charAt(0).toUpperCase() + p.heard.slice(1),
    sets:
      p.sets.length > 0
        ? p.sets.map((s) => ({
            key: newKey(),
            reps: toField(s.reps),
            durationSec: toField(s.durationSec),
            addedWeightLb: toField(s.addedWeightLb),
          }))
        : [emptySet(newKey())],
  }));
}

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
        newExerciseName: null,
      }));

    case "chooseNewExercise":
      return updateExercise(exercises, action.exerciseKey, (e) => ({
        ...e,
        exerciseId: "",
        newExerciseName: e.newExerciseName ?? "",
      }));

    case "renameNewExercise":
      return updateExercise(exercises, action.exerciseKey, (e) => ({
        ...e,
        newExerciseName: action.name,
      }));

    case "appendParsed":
      return [...exercises.filter((e) => !isBlank(e)), ...action.exercises];

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
      ...(e.newExerciseName === null
        ? { exerciseId: e.exerciseId }
        : { newExerciseName: e.newExerciseName }),
      sets: e.sets.map((s) => ({
        reps: toNumber(s.reps),
        durationSec: toNumber(s.durationSec),
        addedWeightLb: toNumber(s.addedWeightLb),
      })),
    })),
  };
}
