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
import { authUsers } from "drizzle-orm/supabase";

// Every table enables RLS with no policies, which blocks Supabase's
// auto-generated REST API. The app connects as `postgres` (bypasses RLS) and
// enforces authorization in src/server. See docs/decisions.md.

export const roleEnum = pgEnum("role", ["athlete", "coach"]);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// Profile row per auth user; created by the on_auth_user_created trigger.
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("athlete"),
  createdAt: createdAt(),
}).enableRLS();

// Roles of both sides are enforced in application code: a CHECK constraint
// can't look at other rows.
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
    // The primary key covers lookups by coach; this covers lookups by athlete.
    index("coach_athletes_athlete_id_idx").on(t.athleteId),
  ],
).enableRLS();

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    // Null for seeded exercises. `set null`: other users' sets may use it.
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("exercises_name_lower_idx").on(sql`lower(${t.name})`)],
).enableRLS();

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    performedOn: date("performed_on").notNull(),
    notes: text("notes"),
    createdAt: createdAt(),
  },
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
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id),
    // 1-based order of the exercise within the workout, as logged.
    exercisePosition: integer("exercise_position").notNull(),
    setNumber: integer("set_number").notNull(),
    reps: integer("reps"),
    durationSec: integer("duration_sec"),
    // Drizzle returns numeric as a string by default.
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
