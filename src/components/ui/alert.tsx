import type { ReactNode } from "react";

/** A form-level error message, announced to screen readers. */
export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
    >
      {children}
    </p>
  );
}

/** A validation message under a single field. Renders nothing without one. */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}
