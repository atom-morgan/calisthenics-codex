import Link from "next/link";
import { requireUser } from "@/server/auth";

// Placeholder until the workout history list (next step).
export default async function WorkoutsPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Workouts</h1>
        <Link
          href="/workouts/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Log workout
        </Link>
      </div>
      <p className="text-zinc-600 dark:text-zinc-400">
        Welcome, {user.name}. Your workout history will appear here.
      </p>
    </div>
  );
}
