"use client";

import { type SubmitEvent, useState, useTransition } from "react";
import { ErrorAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";
import {
  MAX_INPUT_LENGTH,
  type ParsedExercise,
} from "@/lib/workout-parser/parse";
import { parseWorkoutAction } from "../actions";

type DescribeWorkoutProps = {
  onParsed: (parsed: {
    exercises: ParsedExercise[];
    notes: string | null;
  }) => void;
};

export function DescribeWorkout({ onParsed }: DescribeWorkoutProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [warnings, setWarnings] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await parseWorkoutAction(text);
      if (!result.ok) {
        setError(result.error);
        setWarnings([]);
        return;
      }
      setError(undefined);
      setWarnings(result.warnings);
      // Cleared so parsing again adds new exercises instead of duplicates.
      setText("");
      onParsed(result);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-surface p-4 dark:border-zinc-800"
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Describe your workout</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={MAX_INPUT_LENGTH}
          placeholder="pullups 8/8/6, 3x10 dips, l-sit 30s"
          className={`${inputClasses} resize-y`}
        />
      </label>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          disabled={pending || text.trim() === ""}
        >
          {pending ? "Reading…" : "Fill in the form"}
        </Button>
        <span className="text-xs text-zinc-500">
          You can review and edit everything before saving.
        </span>
      </div>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      {warnings.length > 0 && (
        <ul
          role="status"
          className="flex list-disc flex-col gap-1 rounded-md bg-amber-50 py-2 pr-3 pl-7 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
