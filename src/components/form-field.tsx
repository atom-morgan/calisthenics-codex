import type { InputHTMLAttributes } from "react";
import { FieldError } from "@/components/ui/alert";
import { inputClasses } from "@/components/ui/input";

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  errors?: string[];
};

export function FormField({
  label,
  name,
  errors,
  ...inputProps
}: FormFieldProps) {
  const errorId = `${name}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        className={inputClasses}
        {...inputProps}
      />
      <FieldError id={errorId} message={errors?.join(" ")} />
    </div>
  );
}
