import Link from "next/link";
import { formatSets, formatWorkoutDate } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { listWorkoutsForUser } from "@/server/workouts";

const primaryButton =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

// Server Component: queries the database directly while rendering. While it
// loads, Next shows loading.tsx; if it throws, Next shows error.tsx.
export default async function WorkoutsPage() {
  const user = await requireUser();
  const workouts = await listWorkoutsForUser(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Workouts</h1>
        {workouts.length > 0 && (
          <Link href="/workouts/new" className={primaryButton}>
            Log workout
          </Link>
        )}
      </div>

      {workouts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center dark:border-zinc-700">
          <p className="text-zinc-600 dark:text-zinc-400">No workouts yet.</p>
          <Link href="/workouts/new" className={primaryButton}>
            Log your first workout
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {workouts.map((workout) => (
            <li
              key={workout.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-semibold">
                  <time dateTime={workout.performedOn}>
                    {formatWorkoutDate(workout.performedOn)}
                  </time>
                </h2>
                {workout.notes && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{workout.notes}</p>
                )}
              </div>
              <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-1 text-sm">
                {workout.exercises.map((exercise) => (
                  <div key={exercise.position} className="contents">
                    <dt className="font-medium">{exercise.name}</dt>
                    <dd className="text-zinc-700 dark:text-zinc-300">
                      {formatSets(exercise.sets)}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}

      {workouts.length === 20 && (
        <p className="text-center text-sm text-zinc-500">Showing your 20 most recent workouts.</p>
      )}
    </div>
  );
}
