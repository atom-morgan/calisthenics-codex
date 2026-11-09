"use client";

import { type SubmitEvent, useState, useTransition } from "react";
import { ErrorAlert, WarningList } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
      className="flex flex-col gap-3 rounded-xl border border-accent/40 bg-surface p-5 shadow-card"
    >
      <label className="flex flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          Describe your workout <Badge tone="accent">AI</Badge>
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={MAX_INPUT_LENGTH}
          placeholder="pullups 8/8/6, 3x10 dips, l-sit 30s"
          className={`${inputClasses} resize-y font-mono`}
        />
      </label>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button
          type="submit"
          size="sm"
          disabled={pending || text.trim() === ""}
        >
          {pending ? "Reading…" : "Fill in the form"}
        </Button>
        <span className="text-xs text-muted">
          You can review and edit everything before saving.
        </span>
      </div>
      {error && <ErrorAlert>{error}</ErrorAlert>}
      <WarningList warnings={warnings} />
    </form>
  );
}
