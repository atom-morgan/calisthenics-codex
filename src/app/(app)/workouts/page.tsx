import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { formatSets, formatWorkoutDate } from "@/lib/format";
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
        <ul className="flex flex-col gap-4">
          {workouts.map((workout) => (
            <li
              key={workout.id}
              className={`${cardClasses} flex flex-col gap-4 p-5`}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <h2 className="font-semibold tracking-tight">
                  <time dateTime={workout.performedOn}>
                    {formatWorkoutDate(workout.performedOn)}
                  </time>
                </h2>
                <Badge>
                  {workout.exercises.length}{" "}
                  {workout.exercises.length === 1 ? "exercise" : "exercises"}
                </Badge>
              </div>
              <dl className="flex flex-col divide-y divide-line">
                {workout.exercises.map((exercise) => (
                  <div
                    key={exercise.position}
                    className="flex items-baseline justify-between gap-4 py-2 first:pt-0 last:pb-0"
                  >
                    <dt className="text-sm font-medium">{exercise.name}</dt>
                    <dd className="text-right font-mono text-sm text-muted tabular-nums">
                      {formatSets(exercise.sets)}
                    </dd>
                  </div>
                ))}
              </dl>
              {workout.notes && (
                <p className="border-l-2 border-accent pl-3 text-sm text-muted">
                  {workout.notes}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {workouts.length === 20 && (
        <p className="text-center text-sm text-muted">
          Showing your 20 most recent workouts.
        </p>
      )}
    </div>
  );
}
