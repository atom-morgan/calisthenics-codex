import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { WorkoutList } from "@/components/workout-list";
import { requireUser } from "@/server/auth";
import { listWorkoutsForUser } from "@/server/workouts";

export default async function WorkoutsPage() {
  const user = await requireUser();
  const workouts = await listWorkoutsForUser(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">Workouts</h1>
          <p className="text-sm text-muted">Your most recent sessions.</p>
        </div>
        {workouts.length > 0 && (
          <Link href="/workouts/new" className={buttonClasses()}>
            Log workout
          </Link>
        )}
      </div>

      {workouts.length === 0 ? (
        <div
          className={`${cardClasses} flex flex-col items-center gap-4 border-dashed px-6 py-14 text-center`}
        >
          <div className="flex flex-col gap-1">
            <p className="font-medium">No workouts yet</p>
            <p className="text-sm text-muted">
              Describe a session in plain English, or fill in the form.
            </p>
          </div>
          <Link href="/workouts/new" className={buttonClasses()}>
            Log your first workout
          </Link>
        </div>
      ) : (
        <WorkoutList workouts={workouts} />
      )}

      {workouts.length === 20 && (
        <p className="text-center text-sm text-muted">
          Showing your 20 most recent workouts.
        </p>
      )}
    </div>
  );
}
