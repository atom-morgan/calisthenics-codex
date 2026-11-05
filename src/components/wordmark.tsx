export const APP_NAME = "Calisthenics Codex";

/** The logo: accent mark plus the app name. */
export function Wordmark() {
  return (
    <span className="flex items-center gap-2 font-semibold tracking-tight">
      <span aria-hidden className="size-2.5 rounded-sm bg-accent" />
      {APP_NAME}
    </span>
  );
}
