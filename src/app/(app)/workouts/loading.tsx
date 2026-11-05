// Shown automatically by Next while page.tsx is loading its data (Next wraps
// the page in a <Suspense> boundary with this as the fallback).
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading workouts">
      <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="h-5 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}
