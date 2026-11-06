import { Badge } from "@/components/ui/badge";
import { cardClasses } from "@/components/ui/card";
import { formatSets, formatWorkoutDate } from "@/lib/format";
import type { WorkoutSummary } from "@/server/workouts";

/** Workout history cards. Shared by an athlete's own history and the coach view. */
export function WorkoutList({ workouts }: { workouts: WorkoutSummary[] }) {
  return (
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
  );
}
