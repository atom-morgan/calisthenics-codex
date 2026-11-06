import "server-only";

import { and, asc, count, eq, max, sql } from "drizzle-orm";
import { db } from "@/db";
import { coachAthletes, users, workouts } from "@/db/schema";
import { listWorkoutsForUser, type WorkoutSummary } from "./workouts";

/**
 * No coach with that email. Also thrown for non-coach accounts, so the error
 * can't be used to probe which emails have accounts.
 */
export class CoachNotFoundError extends Error {
  constructor() {
    super("No coach with that email.");
    this.name = "CoachNotFoundError";
  }
}

export class NotAnAthleteError extends Error {
  constructor() {
    super("Only athletes can add a coach.");
    this.name = "NotAnAthleteError";
  }
}

export type CoachSummary = { id: string; name: string; email: string };

/**
 * Gives the coach with this email read access to the athlete's workouts.
 * Idempotent. Access only ever starts here, from the athlete's side.
 *
 * `athleteId` must come from requireUser().
 */
export async function addCoach(
  athleteId: string,
  coachEmail: string,
): Promise<CoachSummary> {
  return db.transaction(async (tx) => {
    const [athlete] = await tx
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, athleteId));
    if (athlete?.role !== "athlete") throw new NotAnAthleteError();

    const [coach] = await tx
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        and(
          eq(sql`lower(${users.email})`, coachEmail.toLowerCase()),
          eq(users.role, "coach"),
        ),
      );
    if (!coach) throw new CoachNotFoundError();

    await tx
      .insert(coachAthletes)
      .values({ coachId: coach.id, athleteId })
      .onConflictDoNothing();
    return coach;
  });
}

/** Revokes a coach's access. `athleteId` must come from requireUser(). */
export async function removeCoach(
  athleteId: string,
  coachId: string,
): Promise<void> {
  await db
    .delete(coachAthletes)
    .where(
      and(
        eq(coachAthletes.athleteId, athleteId),
        eq(coachAthletes.coachId, coachId),
      ),
    );
}

/** Coaches who can see this athlete's workouts. */
export async function listCoachesForAthlete(
  athleteId: string,
): Promise<CoachSummary[]> {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(coachAthletes)
    .innerJoin(users, eq(users.id, coachAthletes.coachId))
    .where(eq(coachAthletes.athleteId, athleteId))
    .orderBy(asc(users.name));
}

export type AthleteSummary = {
  id: string;
  name: string;
  email: string;
  workoutCount: number;
  lastWorkoutOn: string | null; // YYYY-MM-DD
};

/**
 * Athletes who have added this coach, with a little activity context.
 *
 * `coachId` must come from requireUser(): the join on it is the access rule.
 */
export async function listAthletesForCoach(
  coachId: string,
): Promise<AthleteSummary[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      workoutCount: count(workouts.id),
      lastWorkoutOn: max(workouts.performedOn),
    })
    .from(coachAthletes)
    .innerJoin(users, eq(users.id, coachAthletes.athleteId))
    .leftJoin(workouts, eq(workouts.userId, users.id))
    .where(eq(coachAthletes.coachId, coachId))
    .groupBy(users.id)
    .orderBy(asc(users.name));
}

/**
 * An athlete's recent workouts, or null unless that athlete has added this
 * coach. Null covers "not linked" and "doesn't exist" alike, so callers return
 * the same 404 for both.
 *
 * `coachId` must come from requireUser(); `athleteId` is untrusted input.
 */
export async function listAthleteWorkoutsForCoach(
  coachId: string,
  athleteId: string,
): Promise<{
  athlete: { id: string; name: string };
  workouts: WorkoutSummary[];
} | null> {
  const [athlete] = await db
    .select({ id: users.id, name: users.name })
    .from(coachAthletes)
    .innerJoin(users, eq(users.id, coachAthletes.athleteId))
    .where(
      and(
        eq(coachAthletes.coachId, coachId),
        eq(coachAthletes.athleteId, athleteId),
      ),
    );
  if (!athlete) return null;

  return { athlete, workouts: await listWorkoutsForUser(athlete.id) };
}
