import { cardClasses } from "@/components/ui/card";
import { formatSets } from "@/lib/format";

const INPUT = "pullups 8/8/6, 3x10 dips, l-sit 30s, felt strong";

const set = (reps: number | null, durationSec: number | null = null) => ({
  reps,
  durationSec,
  addedWeightLb: null,
});

// Static example of what the parser produces, formatted like the history list.
const PARSED = [
  { name: "Pull-up", sets: [set(8), set(8), set(6)] },
  { name: "Dip", sets: [set(10), set(10), set(10)] },
  { name: "L-sit", sets: [set(null, 30)] },
];

export function LandingDemo() {
  return (
    <div className={`${cardClasses} overflow-hidden shadow-lift`}>
      <div className="flex flex-col gap-2 border-b border-line bg-surface p-5">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          You type
        </span>
        <p className="font-mono text-sm">
          <span className="text-accent-text">›</span> {INPUT}
        </p>
      </div>
      <div className="flex flex-col gap-3 p-5">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          It logs
        </span>
        <dl className="flex flex-col divide-y divide-line">
          {PARSED.map((exercise) => (
            <div
              key={exercise.name}
              className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0"
            >
              <dt className="text-sm font-medium">{exercise.name}</dt>
              <dd className="font-mono text-sm text-muted tabular-nums">
                {formatSets(exercise.sets)}
              </dd>
            </div>
          ))}
        </dl>
        <p className="border-l-2 border-accent pl-3 text-sm text-muted">
          felt strong
        </p>
      </div>
    </div>
  );
}
