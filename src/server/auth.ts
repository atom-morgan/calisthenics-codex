import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = Pick<
  typeof users.$inferSelect,
  "id" | "email" | "name" | "role"
>;

// The single source of truth for "who is making this request?". Every
// protected page, Server Action, and data function goes through here (or
// requireUser below). The user id comes from a verified token, never from
// request input.
//
// React's cache() dedupes calls within one server render, so a layout and a
// page can both call this without two auth checks and two DB queries.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  // getClaims() verifies the token's signature. (getSession() would not; it
  // trusts whatever is in the cookie.)
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (error || !userId) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // A valid login with no profile row shouldn't happen (a DB trigger creates
  // the row at signup). Treat it as logged out rather than half-logged-in.
  return user ?? null;
});

// For pages and actions that must have a user: redirects to /login if not.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
