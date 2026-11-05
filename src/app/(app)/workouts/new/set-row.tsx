import { FieldError } from "@/components/ui/alert";
import { inputClasses } from "@/components/ui/input";
import type { SetDraft, SetField } from "./workout-draft";

export const SET_GRID = "grid grid-cols-[2.5rem_1fr_1fr_1fr_2rem] gap-2";

type SetRowProps = {
  set: SetDraft;
  number: number;
  label: string;
  error?: string;
  onChange: (field: SetField, value: string) => void;
  onRemove?: () => void;
};

export function SetRow({
  set,
  number,
  label,
  error,
  onChange,
  onRemove,
}: SetRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`${SET_GRID} items-center`}>
        <span className="text-sm text-zinc-500">{number}</span>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          aria-label={`Set ${label} reps`}
          value={set.reps}
          onChange={(e) => onChange("reps", e.target.value)}
          aria-invalid={Boolean(error)}
          className={inputClasses}
        />
        <input
          type="number"
          inputMode="numeric"
          min={1}
          aria-label={`Set ${label} hold seconds`}
          value={set.durationSec}
          onChange={(e) => onChange("durationSec", e.target.value)}
          aria-invalid={Boolean(error)}
          className={inputClasses}
        />
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          aria-label={`Set ${label} added weight in pounds`}
          value={set.addedWeightLb}
          onChange={(e) => onChange("addedWeightLb", e.target.value)}
          className={inputClasses}
        />
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove set ${label}`}
            className="rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
          >
            ×
          </button>
        ) : (
          <span />
        )}
      </div>
      <FieldError message={error} />
    </div>
  );
}
