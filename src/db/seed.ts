// Idempotent: names that already exist are skipped via the lower(name) index.
import { db } from "./index";
import { exercises } from "./schema";
import { SEED_EXERCISES } from "./seed-exercises";

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
