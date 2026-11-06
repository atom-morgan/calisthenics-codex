import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";

// The parts of Supabase our migrations depend on: auth.users (FK target and
// trigger source) and the API roles the trigger migration revokes from.
const SUPABASE_STUB = `
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    raw_user_meta_data jsonb NOT NULL DEFAULT '{}'
  );
`;

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

/** A fresh in-memory Postgres with the app's real migrations applied. */
export async function createTestDb() {
  const client = new PGlite();
  await client.exec(SUPABASE_STUB);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db;
}

/**
 * Inserts into auth.users the way Supabase Auth does at signup, so the
 * profile trigger runs. Returns the new user's id.
 */
export async function createAuthUser(
  db: TestDb,
  email: string,
  metadata: Record<string, unknown> = {},
): Promise<string> {
  const result = await db.execute<{ id: string }>(
    sql`INSERT INTO auth.users (email, raw_user_meta_data)
        VALUES (${email}, ${JSON.stringify(metadata)}::jsonb)
        RETURNING id`,
  );
  return result.rows[0].id;
}

/** Removes all users (cascading to their data) and exercises. */
export async function resetDb(db: TestDb) {
  await db.execute(sql`TRUNCATE auth.users, public.exercises CASCADE`);
}
