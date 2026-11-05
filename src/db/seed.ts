// Idempotent: names that already exist are skipped via the lower(name) index.
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
  .finally(() => db.$client.end());
