import { sql } from "drizzle-orm";
import { db } from "@/db";

// Pinged by .github/workflows/keep-alive.yml. It must run a real query:
// Supabase pauses free projects after a week without database activity, and
// the public pages never touch the database. See docs/decisions.md (22).
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("health check failed", error);
    return Response.json({ ok: false }, { status: 503 });
  }
}
