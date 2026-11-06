import { cardClasses } from "@/components/ui/card";

// Also covers /athletes/[id], which has no loading state of its own.
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col gap-2">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-fg/10" />
        <div className="h-4 w-56 animate-pulse rounded bg-fg/5" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${cardClasses} flex justify-between p-5`}>
          <div className="flex flex-col gap-2">
            <div className="h-5 w-32 animate-pulse rounded bg-fg/10" />
            <div className="h-4 w-44 animate-pulse rounded bg-fg/5" />
          </div>
          <div className="h-5 w-24 animate-pulse rounded-full bg-fg/5" />
        </div>
      ))}
    </div>
  );
}
