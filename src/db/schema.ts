import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
// Supabase's built-in auth.users table. Drizzle only references it for the
// foreign key below; it never creates or migrates it (see schemaFilter in
// drizzle.config.ts).
import { authUsers } from "drizzle-orm/supabase";

// Every table calls .enableRLS() with no policies. Supabase auto-exposes the
// public schema over a REST API reachable with the (public) anon key; RLS with
// no policies blocks all of that. Our server connects as the `postgres` role,
// which bypasses RLS, and enforces authorization in TypeScript instead.

export const roleEnum = pgEnum("role", ["athlete", "coach"]);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// Our profile table. `id` is the same UUID as the Supabase auth user, so a
// session's user id can be used directly in queries.
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("athlete"),
  createdAt: createdAt(),
}).enableRLS();

// Link table: one coach has many athletes. "coach_id is a coach" and
// "athlete_id is an athlete" are enforced in application code (Day 3), since
// a CHECK constraint can't look at other rows.
export const coachAthletes = pgTable(
  "coach_athletes",
  {
    coachId: uuid("coach_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.coachId, t.athleteId] }),
    // The PK index covers lookups by coach; this one covers "who coaches me?".
    index("coach_athletes_athlete_id_idx").on(t.athleteId),
  ],
).enableRLS();

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    // Null for seeded exercises. If the creator is deleted, keep the exercise
    // (other users' sets may reference it) and just drop the attribution.
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  // Case-insensitive uniqueness: "Pull-up" and "pull-up" are the same exercise.
  (t) => [uniqueIndex("exercises_name_lower_idx").on(sql`lower(${t.name})`)],
).enableRLS();

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // "YYYY-MM-DD" string in TypeScript: a calendar day, no timezone.
    performedOn: date("performed_on").notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  // History views: "this user's workouts, newest first".
  (t) => [
    index("workouts_user_id_performed_on_idx").on(
      t.userId,
      t.performedOn.desc(),
    ),
  ],
).enableRLS();

export const sets = pgTable(
  "sets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    // No cascade: an exercise that has logged sets can't be deleted.
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    // Which block of the workout this set belongs to (1 = first exercise
    // logged). Keeps the order the athlete did things in; set_number orders
    // sets within the block's exercise.
    exercisePosition: integer("exercise_position").notNull(),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps"),
    durationSec: integer("duration_sec"),
    // mode "number" returns a JS number instead of Postgres numeric's
    // default string representation. Fine for body-weight-scale values.
    addedWeightLb: numeric("added_weight_lb", { mode: "number" }),
    createdAt: createdAt(),
  },
  (t) => [
    index("sets_workout_id_idx").on(t.workoutId),
    index("sets_exercise_id_idx").on(t.exerciseId),
    check(
      "sets_reps_or_duration",
      sql`${t.reps} is not null or ${t.durationSec} is not null`,
    ),
    check("sets_set_number_positive", sql`${t.setNumber} > 0`),
    check("sets_exercise_position_positive", sql`${t.exercisePosition} > 0`),
    check(
      "sets_values_non_negative",
      sql`coalesce(${t.reps}, 0) >= 0 and coalesce(${t.durationSec}, 0) >= 0 and coalesce(${t.addedWeightLb}, 0) >= 0`,
    ),
  ],
).enableRLS();
