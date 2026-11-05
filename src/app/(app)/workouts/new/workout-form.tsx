"use client";

import Link from "next/link";
import {
  startTransition,
  type SubmitEvent,
  useActionState,
  useReducer,
  useState,
} from "react";
import { ErrorAlert, FieldError } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { inputClasses } from "@/components/ui/input";
import { useLocalToday } from "@/lib/use-local-today";
import type { WorkoutFormState } from "@/lib/validation/workout";
import type { ParsedExercise } from "@/lib/workout-parser/parse";
import type { ExerciseOption } from "@/server/exercises";
import { createWorkoutAction } from "../actions";
import { DescribeWorkout } from "./describe-workout";
import { ExerciseBlock } from "./exercise-block";
import {
  draftsFromParsed,
  emptyExercise,
  exercisesReducer,
  toWorkoutInput,
} from "./workout-draft";

const newKey = () => crypto.randomUUID();

export function WorkoutForm({ exercises }: { exercises: ExerciseOption[] }) {
  const today = useLocalToday();
  // null until the user picks a date, so it can default to today.
  const [date, setDate] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [drafts, dispatch] = useReducer(exercisesReducer, undefined, () => [
    emptyExercise(newKey(), newKey()),
  ]);
  const [state, formAction, pending] = useActionState<
    WorkoutFormState,
    unknown
  >(createWorkoutAction, {});
  const issues = state.issues ?? {};
  const performedOn = date ?? today;

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    // Not <form action>: we send a typed object, and want no automatic reset.
    event.preventDefault();
    startTransition(() =>
      formAction(toWorkoutInput(performedOn, notes, drafts)),
    );
  }

  function handleParsed(parsed: {
    exercises: ParsedExercise[];
    notes: string | null;
  }) {
    dispatch({
      type: "appendParsed",
      exercises: draftsFromParsed(parsed.exercises, newKey),
    });
    if (parsed.notes) {
      setNotes((current) =>
        current ? `${current}; ${parsed.notes}` : (parsed.notes ?? ""),
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <DescribeWorkout onParsed={handleParsed} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <div
          className={`${cardClasses} grid gap-4 p-5 sm:grid-cols-[12rem_1fr]`}
        >
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
              Notes <span className="font-normal text-muted">(optional)</span>
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

        {drafts.map((exercise, index) => (
          <ExerciseBlock
            key={exercise.key}
            exercise={exercise}
            index={index}
            options={exercises}
            issues={issues}
            canRemove={drafts.length > 1}
            dispatch={dispatch}
          />
        ))}

        <Button
          variant="secondary"
          className="self-start border-dashed"
          onClick={() =>
            dispatch({ type: "addExercise", key: newKey(), setKey: newKey() })
          }
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
            className="text-sm text-muted transition-colors hover:text-fg"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
