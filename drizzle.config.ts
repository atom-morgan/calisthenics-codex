import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so it doesn't load .env.local by itself.
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // Only `migrate` and `studio` connect; `generate` just diffs the schema
  // file against previous migrations, so it works without a database.
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL ?? "" },
  // Only manage our tables. Supabase owns the auth, storage, etc. schemas.
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
