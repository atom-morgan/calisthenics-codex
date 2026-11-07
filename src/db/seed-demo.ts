// Creates the demo coach and athletes with eight weeks of history. Re-running
// resets only the demo accounts' workouts and coach links.
// Uses the app's real paths: Supabase signup (so the profile trigger runs),
// addCoach, and createWorkout.
import { createClient } from "@supabase/supabase-js";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { supabaseEnv } from "@/lib/supabase/env";
import { addCoach } from "@/server/coaching";
import { createWorkout } from "@/server/workouts";
import { buildDemoAthletes, DEMO_COACH } from "./demo-data";
import { db } from "./index";
import { coachAthletes, exercises, users, workouts } from "./schema";

const { DEMO_PASSWORD } = z
  .object({
    DEMO_PASSWORD: z.string().min(12, "DEMO_PASSWORD needs 12+ characters."),
  })
  .parse(process.env);

const supabase = createClient(
  supabaseEnv.SUPABASE_URL,
  supabaseEnv.SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

/**
 * Signs the account up, or proves we own it by signing in. An existing
 * account the demo password can't open is someone else's: stop.
 */
async function ensureUser(
  email: string,
  name: string,
  role: "athlete" | "coach",
): Promise<string> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: DEMO_PASSWORD,
    options: { data: { name, role } },
  });
  let id = data.user?.id;
  if (error) {
    if (error.code !== "user_already_exists") throw error;
    const signIn = await supabase.auth.signInWithPassword({
      email,
      password: DEMO_PASSWORD,
    });
    if (signIn.error || !signIn.data.user) {
      throw new Error(
        `${email} exists but isn't a demo account. Not touching it.`,
      );
    }
    id = signIn.data.user.id;
  }
  await supabase.auth.signOut();
  if (!id) throw new Error(`Signup for ${email} returned no user.`);

  const [profile] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, id));
  if (profile?.role !== role) {
    throw new Error(`${email} should be a ${role}, found ${profile?.role}.`);
  }
  return id;
}

async function main() {
  const catalog = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises);
  const exerciseId = new Map(catalog.map((e) => [e.name, e.id]));

  await ensureUser(DEMO_COACH.email, DEMO_COACH.name, "coach");
  const athletes = buildDemoAthletes(new Date());
  const athleteIds: string[] = [];
  for (const athlete of athletes) {
    athleteIds.push(await ensureUser(athlete.email, athlete.name, "athlete"));
  }

  await db.delete(workouts).where(inArray(workouts.userId, athleteIds));
  await db
    .delete(coachAthletes)
    .where(inArray(coachAthletes.athleteId, athleteIds));

  for (const [i, athlete] of athletes.entries()) {
    const userId = athleteIds[i];
    await addCoach(userId, DEMO_COACH.email);
    for (const workout of athlete.workouts) {
      await createWorkout(userId, {
        ...workout,
        exercises: workout.exercises.map((e) => {
          const id = exerciseId.get(e.name);
          if (!id)
            throw new Error(
              `"${e.name}" isn't seeded. Run npm run db:seed first.`,
            );
          return { exerciseId: id, sets: e.sets };
        }),
      });
    }
    console.log(`${athlete.name}: ${athlete.workouts.length} workouts`);
  }
  console.log(`Linked ${athletes.length} athletes to ${DEMO_COACH.name}.`);
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
