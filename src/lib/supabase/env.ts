import { z } from "zod";

// Validated once at import, so a missing variable fails loudly at startup
// instead of as a confusing auth error later.
const envSchema = z.object({
  SUPABASE_URL: z.url().refine((url) => new URL(url).pathname === "/", {
    message:
      "SUPABASE_URL must be the base project URL (https://<ref>.supabase.co), without /rest/v1/",
  }),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export const supabaseEnv = envSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
});
