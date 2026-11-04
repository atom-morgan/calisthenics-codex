# Data Model

Postgres, managed with Drizzle migrations. Names are `snake_case` in the database and `camelCase` in TypeScript.

## Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | Match the auth provider's user id if possible |
| email | text, unique, not null | |
| name | text, not null | |
| role | enum (`athlete`, `coach`), not null | Default `athlete` |
| created_at | timestamptz, not null | Default `now()` |

### coach_athletes
Link table: one coach has many athletes.

| Column | Type | Notes |
|---|---|---|
| coach_id | uuid, FK to users.id | |
| athlete_id | uuid, FK to users.id | |
| created_at | timestamptz, not null | Default `now()` |

Primary key: (`coach_id`, `athlete_id`). Both foreign keys use `ON DELETE CASCADE`. Enforce in application code (and ideally a check) that `coach_id` refers to a user with role `coach` and `athlete_id` to a user with role `athlete`.

### exercises
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text, not null | e.g. "Pull-up", "Dip", "Pistol squat" |
| created_by | uuid, FK to users.id, nullable | Null for seeded exercises |
| created_at | timestamptz, not null | Default `now()` |

Unique on lower(name) so "pull-up" and "Pull-Up" don't duplicate. The LLM parser should match against this table and create a new exercise only when no match exists.

### workouts
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK to users.id, not null | `ON DELETE CASCADE` |
| performed_on | date, not null | The day of the workout |
| notes | text, nullable | |
| created_at | timestamptz, not null | Default `now()` |

Index: (`user_id`, `performed_on` desc), since history views query this constantly.

### sets
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| workout_id | uuid, FK to workouts.id, not null | `ON DELETE CASCADE` |
| exercise_id | uuid, FK to exercises.id, not null | |
| set_number | integer, not null | Order within the exercise for that workout |
| reps | integer, nullable | Null for timed holds |
| duration_sec | integer, nullable | For holds (planche, L-sit, etc.) |
| added_weight_lb | numeric, nullable | Weighted calisthenics |
| created_at | timestamptz, not null | Default `now()` |

Add a check constraint so each set has `reps` or `duration_sec` (or both). Index on `exercise_id` and `workout_id` for the progress chart queries.

## Relationships

- A user has many workouts; a workout has many sets; each set belongs to one exercise.
- A coach has many athletes through `coach_athletes`.

## Authorization rules (enforce on the server)

- An athlete can read and write only their own workouts and sets.
- A coach can read (not write) workouts and sets for athletes linked to them in `coach_athletes`.
- Everything else is denied. Write tests for each rule.

## Parsed-entry shape (for Day 2)

The LLM parser should return JSON that Zod validates into roughly:

```ts
{
  exercises: [
    {
      name: string,            // matched against the exercises table
      sets: [
        { reps?: number, durationSec?: number, addedWeightLb?: number }
      ]
    }
  ]
}
```

"3x8 pull-ups" expands to three sets of eight reps. Anything the parser can't interpret should be surfaced in the preview step rather than guessed.

## Drizzle sketch (starting point, not final)

```ts
import { pgTable, pgEnum, uuid, text, date, integer, numeric, timestamp, primaryKey } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["athlete", "coach"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("athlete"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const coachAthletes = pgTable("coach_athletes", {
  coachId: uuid("coach_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  athleteId: uuid("athlete_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.coachId, t.athleteId] })]);

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  performedOn: date("performed_on").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sets = pgTable("sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  workoutId: uuid("workout_id").notNull().references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  durationSec: integer("duration_sec"),
  addedWeightLb: numeric("added_weight_lb"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

The unique index on `lower(exercises.name)`, the check constraint on `sets`, and the indexes above are easiest to add in a hand-edited migration. Ask Claude Code to explain how Drizzle handles those.