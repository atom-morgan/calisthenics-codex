import { FieldError } from "@/components/ui/alert";

const ROLES = [
  { value: "athlete", label: "Athlete", hint: "Log your own training" },
  { value: "coach", label: "Coach", hint: "Follow athletes who add you" },
] as const;

/** Native radios styled as cards, so keyboard and form behavior come free. */
export function RolePicker({
  defaultValue = "athlete",
  error,
}: {
  defaultValue?: string;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-medium">
        I&apos;m signing up as
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map((role) => (
          <label
            key={role.value}
            className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-line bg-page p-3 transition-colors hover:border-line-strong has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:ring-2 has-focus-visible:ring-focus"
          >
            <input
              type="radio"
              name="role"
              value={role.value}
              defaultChecked={defaultValue === role.value}
              className="sr-only"
            />
            <span className="text-sm font-medium">{role.label}</span>
            <span className="text-xs text-muted">{role.hint}</span>
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </fieldset>
  );
}
