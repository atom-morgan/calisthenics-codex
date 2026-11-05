import type { ReactNode } from "react";

/** A form-level error message, announced to screen readers. */
export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
    >
      {children}
    </p>
  );
}

/** Non-blocking notes the user should review. Renders nothing when empty. */
export function WarningList({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <ul
      role="status"
      className="flex list-disc flex-col gap-1 rounded-lg border border-warning/30 bg-warning-soft py-2 pr-3 pl-7 text-sm text-warning"
    >
      {warnings.map((warning) => (
        <li key={warning}>{warning}</li>
      ))}
    </ul>
  );
}

/** A validation message under a single field. Renders nothing without one. */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-danger">
      {message}
    </p>
  );
}
