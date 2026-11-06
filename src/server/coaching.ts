import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { coachAthletes, users } from "@/db/schema";

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
