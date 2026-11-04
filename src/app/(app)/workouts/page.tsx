import { requireUser } from "@/server/auth";

// Placeholder until the workout form and history list (next steps).
export default async function WorkoutsPage() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Workouts</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Welcome, {user.name}. Workout logging is coming next.
      </p>
    </div>
  );
}
