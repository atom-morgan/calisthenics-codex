import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { cardClasses } from "@/components/ui/card";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/server/auth";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (await getCurrentUser()) redirect("/workouts");

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 p-4">
      <Link href="/">
        <Wordmark />
      </Link>
      <div className={`${cardClasses} w-full max-w-sm p-6 shadow-lift sm:p-8`}>
        {children}
      </div>
    </main>
  );
}
