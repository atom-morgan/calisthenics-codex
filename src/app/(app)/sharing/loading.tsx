import { cardClasses } from "@/components/ui/card";

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Loading sharing"
    >
      <div className="flex flex-col gap-2">
        <div className="h-9 w-32 animate-pulse rounded-lg bg-fg/10" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-fg/5" />
      </div>
      <div className={`${cardClasses} flex flex-col gap-4 p-5`}>
        <div className="h-5 w-28 animate-pulse rounded bg-fg/10" />
        <div className="h-10 animate-pulse rounded bg-fg/5" />
      </div>
      <div className={`${cardClasses} h-28 animate-pulse p-5`} />
    </div>
  );
}
