import { cardClasses } from "@/components/ui/card";

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading progress"
    >
      <div className="flex flex-col gap-2">
        <div className="h-9 w-36 animate-pulse rounded-lg bg-fg/10" />
        <div className="h-4 w-56 animate-pulse rounded bg-fg/5" />
      </div>
      <div className="flex gap-2">
        {[20, 16, 24].map((w) => (
          <div
            key={w}
            className="h-8 animate-pulse rounded-full bg-fg/5"
            style={{ width: `${w * 4}px` }}
          />
        ))}
      </div>
      <div className={`${cardClasses} flex flex-col gap-4 p-5`}>
        <div className="flex justify-between">
          <div className="h-5 w-28 animate-pulse rounded bg-fg/10" />
          <div className="h-8 w-16 animate-pulse rounded bg-fg/10" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-fg/5" />
      </div>
    </div>
  );
}
