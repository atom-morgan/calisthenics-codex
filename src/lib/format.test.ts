import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { formatSet, formatSets, formatWorkoutDate } from "./format";

const set = (
  reps: number | null,
  durationSec: number | null = null,
  addedWeightLb: number | null = null,
) => ({ reps, durationSec, addedWeightLb });

describe("formatWorkoutDate", () => {
  // Run in a timezone behind UTC, where a naive `new Date("2026-11-04")`
  // would render as Nov 3.
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "America/Los_Angeles";
  });
  afterAll(() => {
    process.env.TZ = originalTz;
  });

  it("formats a calendar day without shifting it", () => {
    expect(formatWorkoutDate("2026-11-04", 2026)).toBe("Wed, Nov 4");
  });

  it("handles the first day of the year", () => {
    expect(formatWorkoutDate("2026-01-01", 2026)).toBe("Thu, Jan 1");
  });

  it("includes the year for other years", () => {
    expect(formatWorkoutDate("2025-12-31", 2026)).toBe("Wed, Dec 31, 2025");
  });
});

describe("formatSet", () => {
  it.each([
    [set(8), "8"],
    [set(null, 20), "20s"],
    [set(5, 10), "5 × 10s"],
    [set(6, null, 10), "6 +10 lb"],
    [set(6, null, 0), "6"],
  ])("formats %o as %s", (input, expected) => {
    expect(formatSet(input)).toBe(expected);
  });
});

describe("formatSets", () => {
  it("joins sets with a separator", () => {
    expect(formatSets([set(8), set(8), set(6)])).toBe("8 · 8 · 6");
  });

  it("shows a weight shared by every set once", () => {
    expect(formatSets([set(8, null, 10), set(8, null, 10)])).toBe(
      "8 · 8 (+10 lb)",
    );
  });

  it("shows weights per set when they differ", () => {
    expect(formatSets([set(8), set(6, null, 10)])).toBe("8 · 6 +10 lb");
  });

  it("returns an empty string for no sets", () => {
    expect(formatSets([])).toBe("");
  });
});
