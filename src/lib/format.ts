// Pure display helpers (no React, no DB), so they're trivial to unit test.

// "2026-11-04" -> "Wed, Nov 4" (adds the year when it isn't `currentYear`).
//
// performed_on is a calendar day with no time or timezone. `new Date("2026-11-04")`
// would mean midnight UTC, which shows as Nov 3 in US timezones. So build the
// date in UTC and format it in UTC: the day never shifts.
export function formatWorkoutDate(
  isoDate: string,
  currentYear = new Date().getFullYear(),
): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(year !== currentYear && { year: "numeric" }),
  });
}

type SetValues = {
  reps: number | null;
  durationSec: number | null;
  addedWeightLb: number | null;
};

// One set as short text: "8", "20s", "5 × 10s", "6 +10 lb".
export function formatSet({ reps, durationSec, addedWeightLb }: SetValues): string {
  const parts: string[] = [];
  if (reps !== null && durationSec !== null) parts.push(`${reps} × ${durationSec}s`);
  else if (reps !== null) parts.push(String(reps));
  else if (durationSec !== null) parts.push(`${durationSec}s`);
  if (addedWeightLb) parts.push(`+${addedWeightLb} lb`);
  return parts.join(" ");
}

// All sets of one exercise: "8 · 8 · 6". If every set has the same added
// weight, it's shown once at the end ("8 · 8 · 8 (+10 lb)") instead of on
// each set.
export function formatSets(sets: SetValues[]): string {
  const weight = sets[0]?.addedWeightLb ?? null;
  const sameWeight = weight !== null && sets.every((s) => s.addedWeightLb === weight);
  if (!sameWeight) return sets.map(formatSet).join(" · ");

  const withoutWeight = sets.map((s) => formatSet({ ...s, addedWeightLb: null }));
  return `${withoutWeight.join(" · ")} (+${weight} lb)`;
}
