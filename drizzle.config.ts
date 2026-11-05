import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't load .env.local on its own.
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  // May be empty for `generate`, which doesn't connect.
  dbCredentials: { url: process.env.MIGRATION_DATABASE_URL ?? "" },
  // Supabase owns the other schemas (auth, storage, ...).
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
