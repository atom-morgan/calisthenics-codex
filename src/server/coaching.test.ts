import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthUser, resetDb } from "@/test/db";
import { db } from "@/test/mock-db";
import {
  addCoach,
  CoachNotFoundError,
  listCoachesForAthlete,
  NotAnAthleteError,
  removeCoach,
} from "./coaching";

vi.mock("@/db", () => import("@/test/mock-db"));

let athleteId: string;
let otherAthleteId: string;
let coachId: string;

beforeEach(async () => {
  await resetDb(db);
  athleteId = await createAuthUser(db, "ana@example.com", { name: "Ana" });
  otherAthleteId = await createAuthUser(db, "ben@example.com", { name: "Ben" });
  coachId = await createAuthUser(db, "coach@example.com", {
    name: "Coach Cy",
    role: "coach",
  });
});

describe("addCoach", () => {
  it("links the athlete to a coach found by email, case-insensitively", async () => {
    const coach = await addCoach(athleteId, "COACH@example.com");
    expect(coach).toEqual({
      id: coachId,
      name: "Coach Cy",
      email: "coach@example.com",
    });
    expect(await listCoachesForAthlete(athleteId)).toEqual([coach]);
  });

  it("is idempotent", async () => {
    await addCoach(athleteId, "coach@example.com");
    await addCoach(athleteId, "coach@example.com");
    expect(await listCoachesForAthlete(athleteId)).toHaveLength(1);
  });

  it.each([
    ["an unknown email", "nobody@example.com"],
    ["an athlete's email", "ben@example.com"],
  ])("gives the same error for %s", async (_label, email) => {
    await expect(addCoach(athleteId, email)).rejects.toBeInstanceOf(
      CoachNotFoundError,
    );
  });

  it("doesn't let a coach add a coach", async () => {
    const otherCoach = await createAuthUser(db, "dee@example.com", {
      role: "coach",
    });
    await expect(
      addCoach(otherCoach, "coach@example.com"),
    ).rejects.toBeInstanceOf(NotAnAthleteError);
  });
});

describe("removeCoach", () => {
  it("removes only the athlete's own link", async () => {
    await addCoach(athleteId, "coach@example.com");
    await addCoach(otherAthleteId, "coach@example.com");

    await removeCoach(athleteId, coachId);

    expect(await listCoachesForAthlete(athleteId)).toEqual([]);
    expect(await listCoachesForAthlete(otherAthleteId)).toHaveLength(1);
  });

  it("can't remove another athlete's link", async () => {
    await addCoach(otherAthleteId, "coach@example.com");
    // Ana passes Ben's coach: the athleteId filter makes this a no-op.
    await removeCoach(athleteId, coachId);
    expect(await listCoachesForAthlete(otherAthleteId)).toHaveLength(1);
  });
});
