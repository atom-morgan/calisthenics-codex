import { cardClasses } from "@/components/ui/card";

// Without this, the history list's skeleton would show while the form loads.
export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading form"
    >
      <div className="flex flex-col gap-2">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-fg/10" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-fg/5" />
      </div>
      <div className="h-36 animate-pulse rounded-xl border border-line bg-surface" />
      <div className={`${cardClasses} h-24 animate-pulse`} />
      <div className={`${cardClasses} h-48 animate-pulse`} />
    </div>
  );
}
