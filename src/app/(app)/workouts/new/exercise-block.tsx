import type { Dispatch } from "react";
import { FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { inputClasses } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ExerciseOption } from "@/server/exercises";
import { SET_GRID, SetRow } from "./set-row";
import type { ExerciseDraft, ExercisesAction } from "./workout-draft";

// Can't collide with an exercise id, which is always a UUID.
const NEW_EXERCISE = "new";

type ExerciseBlockProps = {
  exercise: ExerciseDraft;
  index: number;
  options: ExerciseOption[];
  issues: Record<string, string>;
  canRemove: boolean;
  dispatch: Dispatch<ExercisesAction>;
};

export function ExerciseBlock({
  exercise,
  index,
  options,
  issues,
  canRemove,
  dispatch,
}: ExerciseBlockProps) {
  const path = `exercises.${index}`;
  const exerciseKey = exercise.key;
  const isNew = exercise.newExerciseName !== null;

  return (
    <fieldset className={`${cardClasses} flex flex-col gap-3 p-5`}>
      <legend className="sr-only">Exercise {index + 1}</legend>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium">Exercise</span>
          <Select
            value={isNew ? NEW_EXERCISE : exercise.exerciseId}
            onChange={(e) =>
              dispatch(
                e.target.value === NEW_EXERCISE
                  ? { type: "chooseNewExercise", exerciseKey }
                  : {
                      type: "selectExercise",
                      exerciseKey,
                      exerciseId: e.target.value,
                    },
              )
            }
            aria-invalid={Boolean(issues[`${path}.exerciseId`])}
          >
            <option value="">Choose…</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
            <option value={NEW_EXERCISE}>New exercise…</option>
          </Select>
        </label>
        {isNew && (
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium">New exercise name</span>
            <input
              value={exercise.newExerciseName ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "renameNewExercise",
                  exerciseKey,
                  name: e.target.value,
                })
              }
              placeholder="Archer pull-up"
              aria-invalid={Boolean(issues[`${path}.newExerciseName`])}
              className={inputClasses}
            />
          </label>
        )}
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            // Phones: right-aligned under the fields. Wider: at the row's end.
            className="self-end sm:mb-1.5"
            onClick={() => dispatch({ type: "removeExercise", exerciseKey })}
          >
            Remove exercise
          </Button>
        )}
      </div>
      <FieldError
        message={
          issues[`${path}.exerciseId`] ?? issues[`${path}.newExerciseName`]
        }
      />

      <div
        className={`${SET_GRID} text-xs font-medium tracking-wide text-muted uppercase`}
      >
        <span>Set</span>
        <span>Reps</span>
        <span>
          Hold <span className="hidden sm:inline">(sec)</span>
          <span className="sm:hidden">(s)</span>
        </span>
        <span>
          <span className="hidden sm:inline">+ Weight (lb)</span>
          <span className="sm:hidden">+ lb</span>
        </span>
        <span />
      </div>
      {exercise.sets.map((set, setIndex) => {
        const setPath = `${path}.sets.${setIndex}`;
        return (
          <SetRow
            key={set.key}
            set={set}
            number={setIndex + 1}
            label={`${index + 1}-${setIndex + 1}`}
            // Refinement errors sit on the set; type errors on a field.
            error={
              issues[setPath] ??
              issues[`${setPath}.reps`] ??
              issues[`${setPath}.durationSec`] ??
              issues[`${setPath}.addedWeightLb`]
            }
            onChange={(field, value) =>
              dispatch({
                type: "updateSet",
                exerciseKey,
                setKey: set.key,
                field,
                value,
              })
            }
            onRemove={
              exercise.sets.length > 1
                ? () =>
                    dispatch({
                      type: "removeSet",
                      exerciseKey,
                      setKey: set.key,
                    })
                : undefined
            }
          />
        );
      })}
      <FieldError message={issues[`${path}.sets`]} />
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() =>
          dispatch({ type: "addSet", exerciseKey, key: crypto.randomUUID() })
        }
      >
        + Add set
      </Button>
    </fieldset>
  );
}
