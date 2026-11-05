import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/server/auth";
import { logout } from "../(auth)/actions";

// Layout for every logged-in page. requireUser() redirects to /login if there's
// no valid session. Pages inside still call requireUser() themselves before
// loading data: layouts don't re-run on every client-side navigation, so a
// layout check alone isn't a reliable guard for a page's data.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/workouts" className="font-semibold">
            Calisthenics Log
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">
              {user.name}
            </span>
            {/* A plain form posting to a Server Action: logout works even
                before JavaScript loads. */}
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
