import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { requireUser } from "@/server/auth";

// Pages still call requireUser() themselves: layouts don't re-render on every
// navigation, so this check alone doesn't guard a page's data.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-page">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/workouts">
              <Wordmark />
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link
                href="/workouts"
                className="transition-colors hover:text-fg"
              >
                Workouts
              </Link>
              <Link
                href="/progress"
                className="transition-colors hover:text-fg"
              >
                Progress
              </Link>
              {user.role === "coach" && (
                <Link
                  href="/athletes"
                  className="transition-colors hover:text-fg"
                >
                  Athletes
                </Link>
              )}
              {user.role === "athlete" && (
                <Link
                  href="/sharing"
                  className="transition-colors hover:text-fg"
                >
                  Sharing
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{user.name}</span>
            <form action={logout}>
              <Button type="submit" variant="secondary" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
