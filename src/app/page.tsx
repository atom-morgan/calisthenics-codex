import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentUser } from "@/server/auth";

export default async function Home() {
  if (await getCurrentUser()) redirect("/workouts");

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col justify-center gap-6 p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Calisthenics Log</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Log workouts, track progress, and share with your coach.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup" className={buttonClasses()}>
          Sign up
        </Link>
        <Link href="/login" className={buttonClasses({ variant: "secondary" })}>
          Log in
        </Link>
      </div>
    </main>
  );
}
