import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";
import { requireUser } from "@/server/auth";
import { NavLinks } from "./nav-links";

// Pages still call requireUser() themselves: layouts don't re-render on every
// navigation, so this check alone doesn't guard a page's data.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const links = [
    { href: "/workouts", label: "Workouts" },
    { href: "/progress", label: "Progress" },
    user.role === "coach"
      ? { href: "/athletes", label: "Athletes" }
      : { href: "/sharing", label: "Sharing" },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-page">
        {/* Phones: wordmark + logout, then links on their own row. */}
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/workouts">
            <Wordmark />
          </Link>
          <div className="order-last w-full sm:order-none sm:mr-auto sm:w-auto">
            <NavLinks links={links} />
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
