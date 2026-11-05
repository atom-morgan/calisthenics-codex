-- Hand-edited: drizzle-kit generated a single `ADD COLUMN ... NOT NULL`, which
-- fails when sets already has rows. Instead: add nullable, backfill, then
-- tighten to NOT NULL. The end state matches the schema snapshot.
ALTER TABLE "sets" ADD COLUMN "exercise_position" integer;--> statement-breakpoint

-- Rows saved before this column existed have no recorded order, so number
-- each workout's exercises alphabetically. Best guess for old data only.
UPDATE "sets" AS s
SET "exercise_position" = ranked.position
FROM (
  SELECT st."id",
         DENSE_RANK() OVER (PARTITION BY st."workout_id" ORDER BY e."name", e."id") AS position
  FROM "sets" st
  JOIN "exercises" e ON e."id" = st."exercise_id"
) AS ranked
WHERE s."id" = ranked."id";--> statement-breakpoint

ALTER TABLE "sets" ALTER COLUMN "exercise_position" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sets" ADD CONSTRAINT "sets_exercise_position_positive" CHECK ("sets"."exercise_position" > 0);
