import { cardClasses } from "@/components/ui/card";

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading workouts"
    >
      <div className="flex flex-col gap-2">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-fg/10" />
        <div className="h-4 w-48 animate-pulse rounded bg-fg/5" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${cardClasses} flex flex-col gap-4 p-5`}>
          <div className="flex justify-between">
            <div className="h-5 w-28 animate-pulse rounded bg-fg/10" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-fg/5" />
          </div>
          <div className="h-4 w-3/4 animate-pulse rounded bg-fg/5" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-fg/5" />
        </div>
      ))}
    </div>
  );
}
