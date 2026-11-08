import Link from "next/link";
import { ProgressChart } from "@/components/progress-chart";
import { cardClasses } from "@/components/ui/card";
import { formatWorkoutDate } from "@/lib/format";
import { METRIC_LABELS, METRIC_UNITS } from "@/lib/progress";
import { getExerciseProgress, listLoggedExercises } from "@/server/progress";

type ProgressPanelProps = {
  /** requireUser()'s id, or an athlete id from a coach access check. */
  userId: string;
  /** From the URL; untrusted, so only used to pick from the user's own list. */
  exerciseId?: string;
  /** Page the exercise links point at, e.g. "/progress". */
  basePath: string;
};

export async function ProgressPanel({
  userId,
  exerciseId,
  basePath,
}: ProgressPanelProps) {
  const logged = await listLoggedExercises(userId);
  if (logged.length === 0) {
    return (
      <p
        className={`${cardClasses} border-dashed px-6 py-14 text-center text-sm text-muted`}
      >
        Log a workout to see progress here.
      </p>
    );
  }

  const selected = logged.find((e) => e.id === exerciseId) ?? logged[0];
  const { metric, points } = await getExerciseProgress(userId, selected.id);
  const unit = METRIC_UNITS[metric];
  const first = points[0];
  const latest = points.at(-1)!;
  const change = latest.value - first.value;

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Exercise" className="flex flex-wrap gap-2">
        {logged.map((exercise) => {
          const current = exercise.id === selected.id;
          return (
            <Link
              key={exercise.id}
              href={`${basePath}?exercise=${exercise.id}`}
              scroll={false}
              aria-current={current ? "page" : undefined}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                current
                  ? "border-accent bg-accent-soft text-fg"
                  : "border-line text-muted hover:border-line-strong hover:text-fg"
              }`}
            >
              {exercise.name}
            </Link>
          );
        })}
      </nav>

      <section className={`${cardClasses} flex flex-col gap-4 p-5`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold tracking-tight">{selected.name}</h2>
            <p className="text-sm text-muted">{METRIC_LABELS[metric]}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="font-mono text-3xl font-semibold tabular-nums">
              {latest.value}
              <span className="ml-1 text-base font-normal text-muted">
                {unit}
              </span>
            </p>
            {points.length > 1 && (
              <p className="text-xs text-muted">
                {change === 0
                  ? "Same as"
                  : `${change > 0 ? "+" : "−"}${Math.abs(change)} ${unit} since`}{" "}
                {formatWorkoutDate(first.date)}
              </p>
            )}
          </div>
        </div>

        {points.length > 1 ? (
          <ProgressChart points={points} metric={metric} />
        ) : (
          <p className="text-sm text-muted">
            One session so far. Log it again to see a trend.
          </p>
        )}

        <details className="text-sm">
          <summary className="cursor-pointer text-muted transition-colors hover:text-fg">
            Show data
          </summary>
          <table className="mt-3 w-full">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted uppercase">
                <th className="py-1 font-medium">Date</th>
                <th className="py-1 text-right font-medium">
                  {METRIC_LABELS[metric]}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {[...points].reverse().map((point) => (
                <tr key={point.date}>
                  <td className="py-1.5">{formatWorkoutDate(point.date)}</td>
                  <td className="py-1.5 text-right font-mono tabular-nums">
                    {point.value} {unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>
    </div>
  );
}
