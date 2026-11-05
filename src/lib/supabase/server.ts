import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

// Per-request client: it carries the current user's session.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseEnv.SUPABASE_URL,
    supabaseEnv.SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies. Safe to ignore: proxy.ts
            // refreshes the session before rendering.
          }
        },
      },
    },
  );
}
