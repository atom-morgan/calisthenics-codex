import { describe, expect, it } from "vitest";
import { bestSetSeries } from "./progress";

const row = (
  performedOn: string,
  reps: number | null,
  durationSec: number | null = null,
  addedWeightLb: number | null = null,
) => ({ performedOn, reps, durationSec, addedWeightLb });

describe("bestSetSeries", () => {
  it("plots the most reps per day, oldest first", () => {
    expect(
      bestSetSeries([
        row("2026-11-04", 8),
        row("2026-11-01", 6),
        row("2026-11-04", 9),
        row("2026-11-01", 5),
      ]),
    ).toEqual({
      metric: "reps",
      points: [
        { date: "2026-11-01", value: 6 },
        { date: "2026-11-04", value: 9 },
      ],
    });
  });

  it("uses the longest hold for exercises never logged with reps", () => {
    expect(
      bestSetSeries([row("2026-11-01", null, 15), row("2026-11-01", null, 20)]),
    ).toEqual({
      metric: "seconds",
      points: [{ date: "2026-11-01", value: 20 }],
    });
  });

  it("uses added weight when every day is weighted", () => {
    expect(
      bestSetSeries([
        row("2026-11-01", 5, null, 25),
        row("2026-11-03", 5, null, 30),
      ]).metric,
    ).toBe("lb");
  });

  it("falls back to reps when some days are bodyweight", () => {
    const series = bestSetSeries([
      row("2026-11-01", 5, null, 25),
      row("2026-11-03", 9),
    ]);
    expect(series.metric).toBe("reps");
    expect(series.points.map((p) => p.value)).toEqual([5, 9]);
  });

  it("returns no points for no sets", () => {
    expect(bestSetSeries([]).points).toEqual([]);
  });
});
