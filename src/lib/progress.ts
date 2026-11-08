/** What "best set" means for an exercise, picked from how it's logged. */
export type ProgressMetric = "reps" | "seconds" | "lb";

export type ProgressPoint = { date: string; value: number }; // date: YYYY-MM-DD

export type ProgressSeries = {
  metric: ProgressMetric;
  points: ProgressPoint[];
};

type SetRow = {
  performedOn: string;
  reps: number | null;
  durationSec: number | null;
  addedWeightLb: number | null;
};

export const METRIC_LABELS: Record<ProgressMetric, string> = {
  reps: "Most reps in a set",
  seconds: "Longest hold",
  lb: "Most added weight",
};

export const METRIC_UNITS: Record<ProgressMetric, string> = {
  reps: "reps",
  seconds: "s",
  lb: "lb",
};

/**
 * One point per day: the best set for the metric. Holds use seconds when the
 * exercise is never logged with reps; weight is used only when every day is
 * weighted (otherwise bodyweight days would plot as zero).
 */
export function bestSetSeries(rows: SetRow[]): ProgressSeries {
  const byDay = new Map<string, SetRow[]>();
  for (const row of rows) {
    byDay.set(row.performedOn, [...(byDay.get(row.performedOn) ?? []), row]);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

  const metric: ProgressMetric = rows.every((r) => r.reps === null)
    ? "seconds"
    : days.length > 0 &&
        days.every(([, sets]) => sets.some((s) => (s.addedWeightLb ?? 0) > 0))
      ? "lb"
      : "reps";

  const valueOf = (s: SetRow) =>
    metric === "seconds"
      ? (s.durationSec ?? 0)
      : metric === "lb"
        ? (s.addedWeightLb ?? 0)
        : (s.reps ?? 0);

  return {
    metric,
    points: days.map(([date, sets]) => ({
      date,
      value: Math.max(...sets.map(valueOf)),
    })),
  };
}
