"use client";

import Link from "next/link";
import {
  startTransition,
  type SubmitEvent,
  useActionState,
  useState,
} from "react";
import { ErrorAlert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";
import type { ExerciseOption } from "@/server/exercises";
import type { WorkoutFormState, WorkoutInput } from "@/lib/validation/workout";
import { useLocalToday } from "@/lib/use-local-today";
import { createWorkoutAction } from "../actions";

// Drafts hold raw input strings; they're converted to numbers on submit.
type SetDraft = {
  key: string;
  reps: string;
  durationSec: string;
  addedWeightLb: string;
};
type ExerciseDraft = { key: string; exerciseId: string; sets: SetDraft[] };

const newKey = () => crypto.randomUUID();
const emptySet = (): SetDraft => ({
  key: newKey(),
  reps: "",
  durationSec: "",
  addedWeightLb: "",
});
const emptyExercise = (): ExerciseDraft => ({
  key: newKey(),
  exerciseId: "",
  sets: [emptySet()],
});

// Blank -> undefined. Invalid input becomes NaN, which Zod rejects.
const toNumber = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

function toInput(
  performedOn: string,
  notes: string,
  drafts: ExerciseDraft[],
): WorkoutInput {
  return {
    performedOn,
    notes,
    exercises: drafts.map((e) => ({
      exerciseId: e.exerciseId,
      sets: e.sets.map((s) => ({
        reps: toNumber(s.reps),
        durationSec: toNumber(s.durationSec),
        addedWeightLb: toNumber(s.addedWeightLb),
      })),
    })),
  };
}

export function WorkoutForm({ exercises }: { exercises: ExerciseOption[] }) {
  const today = useLocalToday();
  // null until the user picks a date, so it can default to today.
  const [date, setDate] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState<ExerciseDraft[]>(() => [
    emptyExercise(),
  ]);
  const [state, formAction, pending] = useActionState<
    WorkoutFormState,
    unknown
  >(createWorkoutAction, {});
  const issues = state.issues ?? {};
  const performedOn = date ?? today;

  function updateExercise(index: number, change: Partial<ExerciseDraft>) {
    setDrafts((prev) =>
      prev.map((e, i) => (i === index ? { ...e, ...change } : e)),
    );
  }
  function updateSet(
    exIndex: number,
    setIndex: number,
    change: Partial<SetDraft>,
  ) {
    setDrafts((prev) =>
      prev.map((e, i) =>
        i !== exIndex
          ? e
          : {
              ...e,
              sets: e.sets.map((s, j) =>
                j === setIndex ? { ...s, ...change } : s,
              ),
            },
      ),
    );
  }
  function addSet(exIndex: number) {
    setDrafts((prev) =>
      prev.map((e, i) => {
        if (i !== exIndex) return e;
        // New sets copy the previous one; most people repeat their numbers.
        const last = e.sets[e.sets.length - 1];
        return {
          ...e,
          sets: [...e.sets, { ...(last ?? emptySet()), key: newKey() }],
        };
      }),
    );
  }
  function removeSet(exIndex: number, setIndex: number) {
    setDrafts((prev) =>
      prev.map((e, i) =>
        i === exIndex
          ? { ...e, sets: e.sets.filter((_, j) => j !== setIndex) }
          : e,
      ),
    );
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Not <form action>: we send a typed object, and want no automatic reset.
    event.preventDefault();
    startTransition(() => formAction(toInput(performedOn, notes, drafts)));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Date</span>
          <input
            type="date"
            value={performedOn}
            max={today || undefined}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={Boolean(issues.performedOn)}
            className={inputClasses}
            required
          />
          <FieldError message={issues.performedOn} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">
            Notes <span className="font-normal text-zinc-500">(optional)</span>
          </span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Felt strong, short rest"
            aria-invalid={Boolean(issues.notes)}
            className={inputClasses}
          />
          <FieldError message={issues.notes} />
        </label>
      </div>

      <FieldError message={issues.exercises} />

      {drafts.map((exercise, exIndex) => {
        const exPath = `exercises.${exIndex}`;
        return (
          <fieldset
            key={exercise.key}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <legend className="sr-only">Exercise {exIndex + 1}</legend>
            <div className="flex items-end gap-2">
              <label className="flex flex-1 flex-col gap-1">
                <span className="text-sm font-medium">Exercise</span>
                <select
                  value={exercise.exerciseId}
                  onChange={(e) =>
                    updateExercise(exIndex, { exerciseId: e.target.value })
                  }
                  aria-invalid={Boolean(issues[`${exPath}.exerciseId`])}
                  className={inputClasses}
                >
                  <option value="">Choose…</option>
                  {exercises.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              {drafts.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDrafts((prev) => prev.filter((_, i) => i !== exIndex))
                  }
                >
                  Remove exercise
                </Button>
              )}
            </div>
            <FieldError message={issues[`${exPath}.exerciseId`]} />

            <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr_2rem] items-center gap-2 text-xs font-medium text-zinc-500">
              <span>Set</span>
              <span>Reps</span>
              <span>Hold (sec)</span>
              <span>+ Weight (lb)</span>
              <span />
            </div>
            {exercise.sets.map((set, setIndex) => {
              const setPath = `${exPath}.sets.${setIndex}`;
              // Refinement errors sit on the set; type errors on a field.
              const setError =
                issues[setPath] ??
                issues[`${setPath}.reps`] ??
                issues[`${setPath}.durationSec`] ??
                issues[`${setPath}.addedWeightLb`];
              const label = `${exIndex + 1}-${setIndex + 1}`;
              return (
                <div key={set.key} className="flex flex-col gap-1">
                  <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr_2rem] items-center gap-2">
                    <span className="text-sm text-zinc-500">
                      {setIndex + 1}
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-label={`Set ${label} reps`}
                      value={set.reps}
                      onChange={(e) =>
                        updateSet(exIndex, setIndex, { reps: e.target.value })
                      }
                      aria-invalid={Boolean(setError)}
                      className={inputClasses}
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      aria-label={`Set ${label} hold seconds`}
                      value={set.durationSec}
                      onChange={(e) =>
                        updateSet(exIndex, setIndex, {
                          durationSec: e.target.value,
                        })
                      }
                      aria-invalid={Boolean(setError)}
                      className={inputClasses}
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      aria-label={`Set ${label} added weight in pounds`}
                      value={set.addedWeightLb}
                      onChange={(e) =>
                        updateSet(exIndex, setIndex, {
                          addedWeightLb: e.target.value,
                        })
                      }
                      className={inputClasses}
                    />
                    {exercise.sets.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeSet(exIndex, setIndex)}
                        aria-label={`Remove set ${label}`}
                        className="rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                      >
                        ×
                      </button>
                    ) : (
                      <span />
                    )}
                  </div>
                  <FieldError message={setError} />
                </div>
              );
            })}
            <FieldError message={issues[`${exPath}.sets`]} />
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => addSet(exIndex)}
            >
              + Add set
            </Button>
          </fieldset>
        );
      })}

      <Button
        variant="secondary"
        className="self-start border-dashed"
        onClick={() => setDrafts((prev) => [...prev, emptyExercise()])}
      >
        + Add exercise
      </Button>

      {state.error && <ErrorAlert>{state.error}</ErrorAlert>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !performedOn}>
          {pending ? "Saving…" : "Save workout"}
        </Button>
        <Link
          href="/workouts"
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
