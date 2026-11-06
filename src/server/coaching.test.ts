import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAuthUser, resetDb } from "@/test/db";
import { db } from "@/test/mock-db";
import { exercises } from "@/db/schema";
import {
  addCoach,
  CoachNotFoundError,
  listAthletesForCoach,
  listAthleteWorkoutsForCoach,
  listCoachesForAthlete,
  NotAnAthleteError,
  removeCoach,
} from "./coaching";
import { createWorkout } from "./workouts";

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

describe("coach access", () => {
  let pullUpId: string;

  const logWorkout = (userId: string, performedOn: string) =>
    createWorkout(userId, {
      performedOn,
      exercises: [{ exerciseId: pullUpId, sets: [{ reps: 8 }] }],
    });

  beforeEach(async () => {
    [{ id: pullUpId }] = await db
      .insert(exercises)
      .values({ name: "Pull-up" })
      .returning({ id: exercises.id });
  });

  it("lists only athletes who added the coach, with activity", async () => {
    await addCoach(athleteId, "coach@example.com");
    await logWorkout(athleteId, "2026-11-01");
    await logWorkout(athleteId, "2026-11-04");
    await logWorkout(otherAthleteId, "2026-11-05"); // Ben never added the coach.

    expect(await listAthletesForCoach(coachId)).toEqual([
      {
        id: athleteId,
        name: "Ana",
        email: "ana@example.com",
        workoutCount: 2,
        lastWorkoutOn: "2026-11-04",
      },
    ]);
  });

  it("includes linked athletes who haven't logged anything", async () => {
    await addCoach(athleteId, "coach@example.com");
    expect(await listAthletesForCoach(coachId)).toMatchObject([
      { id: athleteId, workoutCount: 0, lastWorkoutOn: null },
    ]);
  });

  it("lets a linked coach read the athlete's workouts", async () => {
    await addCoach(athleteId, "coach@example.com");
    await logWorkout(athleteId, "2026-11-04");

    const result = await listAthleteWorkoutsForCoach(coachId, athleteId);
    expect(result?.athlete).toEqual({ id: athleteId, name: "Ana" });
    expect(result?.workouts).toHaveLength(1);
  });

  // Ben is linked to a different coach in the denial tests below, so only the
  // coachId condition can deny access (not the absence of any link).
  const linkBenToAnotherCoach = async () => {
    await createAuthUser(db, "dee@example.com", { role: "coach" });
    await addCoach(otherAthleteId, "dee@example.com");
  };

  it("denies a coach the workouts of an athlete who didn't add them", async () => {
    await linkBenToAnotherCoach();
    await logWorkout(otherAthleteId, "2026-11-04");
    expect(
      await listAthleteWorkoutsForCoach(coachId, otherAthleteId),
    ).toBeNull();
  });

  it("denies access once the athlete removes the coach", async () => {
    await addCoach(athleteId, "coach@example.com");
    await removeCoach(athleteId, coachId);
    expect(await listAthleteWorkoutsForCoach(coachId, athleteId)).toBeNull();
    expect(await listAthletesForCoach(coachId)).toEqual([]);
  });

  it("doesn't let one coach see another coach's athletes", async () => {
    const otherCoach = await createAuthUser(db, "dee@example.com", {
      role: "coach",
    });
    await addCoach(athleteId, "coach@example.com");
    expect(await listAthletesForCoach(otherCoach)).toEqual([]);
    expect(await listAthleteWorkoutsForCoach(otherCoach, athleteId)).toBeNull();
  });

  it("doesn't let an athlete use the coach view to read another athlete", async () => {
    await linkBenToAnotherCoach();
    await logWorkout(otherAthleteId, "2026-11-04");
    expect(
      await listAthleteWorkoutsForCoach(athleteId, otherAthleteId),
    ).toBeNull();
  });

  it("returns null for an id that doesn't exist", async () => {
    expect(
      await listAthleteWorkoutsForCoach(
        coachId,
        "00000000-0000-4000-8000-000000000000",
      ),
    ).toBeNull();
  });
});
