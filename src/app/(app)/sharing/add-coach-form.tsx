"use client";

import { useActionState } from "react";
import { ErrorAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { inputClasses } from "@/components/ui/input";
import type { AddCoachState } from "@/lib/validation/coaching";
import { addCoachAction } from "./actions";

export function AddCoachForm() {
  const [state, formAction, pending] = useActionState<AddCoachState, FormData>(
    addCoachAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Coach&apos;s email</span>
        <div className="flex gap-2">
          <input
            name="email"
            type="email"
            autoComplete="off"
            placeholder="coach@example.com"
            defaultValue={state.values?.email}
            aria-invalid={Boolean(state.error)}
            className={inputClasses}
            required
          />
          <Button type="submit" disabled={pending} className="shrink-0">
            {pending ? "Adding…" : "Add coach"}
          </Button>
        </div>
      </label>
      {state.error && <ErrorAlert>{state.error}</ErrorAlert>}
      {state.success && (
        <p role="status" className="text-sm text-accent-text">
          {state.success}
        </p>
      )}
    </form>
  );
}
