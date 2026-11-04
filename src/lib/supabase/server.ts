import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

// A Supabase client for Server Components and Server Actions, reading and
// writing the session through Next's cookie store. Create one per request;
// never share it between requests (it holds that user's session).
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
            // Server Components can't set cookies (only Server Actions and
            // Route Handlers can). Safe to ignore: proxy.ts refreshes the
            // session cookie on every request before the page renders.
          }
        },
      },
    },
  );
}
