// Seeds the shared exercise list. Safe to run repeatedly: existing names are
// skipped by the case-insensitive unique index on exercises.
// Run with `npm run db:seed` (loads .env.local via Node's --env-file).
import { db } from "./index";
import { exercises } from "./schema";

const SEED_EXERCISES = [
  // Pull
  "Pull-up",
  "Chin-up",
  "Inverted row",
  "Muscle-up",
  // Push
  "Push-up",
  "Archer push-up",
  "Pike push-up",
  "Dip",
  "Handstand push-up",
  // Legs
  "Squat",
  "Pistol squat",
  "Lunge",
  "Nordic curl",
  // Core
  "Hanging leg raise",
  "Dragon flag",
  // Holds (usually logged as duration_sec)
  "Plank",
  "Hollow body hold",
  "L-sit",
  "Handstand hold",
  "Front lever",
  "Back lever",
  "Planche",
];

async function main() {
  const inserted = await db
    .insert(exercises)
    .values(SEED_EXERCISES.map((name) => ({ name })))
    // No target: skip any row that hits a unique constraint, which here is
    // only lower(name). createdBy stays null, marking these as seeded.
    .onConflictDoNothing()
    .returning({ name: exercises.name });

  const skipped = SEED_EXERCISES.length - inserted.length;
  console.log(
    `Seeded ${inserted.length} exercises (${skipped} already existed).`,
  );
}

main()
  .catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  })
  // Close the pool so the script exits instead of hanging on open connections.
  .finally(() => db.$client.end());
