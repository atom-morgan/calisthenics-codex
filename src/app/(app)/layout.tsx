import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/server/auth";

// Pages still call requireUser() themselves: layouts don't re-render on every
// navigation, so this check alone doesn't guard a page's data.
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
            <form action={logout}>
              <Button type="submit" variant="secondary" size="sm">
                Log out
              </Button>
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
