import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cardClasses } from "@/components/ui/card";
import { formatWorkoutDate } from "@/lib/format";
import { requireUser } from "@/server/auth";
import { listAthletesForCoach } from "@/server/coaching";

export default async function AthletesPage() {
  const user = await requireUser();
  if (user.role !== "coach") notFound();

  const athletes = await listAthletesForCoach(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Athletes</h1>
        <p className="text-sm text-muted">
          Athletes who have shared their training with you.
        </p>
      </div>

      {athletes.length === 0 ? (
        <div
          className={`${cardClasses} flex flex-col items-center gap-1 border-dashed px-6 py-14 text-center`}
        >
          <p className="font-medium">No athletes yet</p>
          <p className="text-sm text-muted">
            Athletes add you from their Sharing page, using your email:{" "}
            <span className="font-mono text-fg">{user.email}</span>
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {athletes.map((athlete) => (
            <li key={athlete.id}>
              <Link
                href={`/athletes/${athlete.id}`}
                className={`${cardClasses} flex items-center justify-between gap-4 p-5 transition-colors hover:border-line-strong focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none`}
              >
                <div className="flex min-w-0 flex-col">
                  <span className="font-semibold tracking-tight">
                    {athlete.name}
                  </span>
                  <span className="truncate text-sm text-muted">
                    {athlete.lastWorkoutOn
                      ? `Last workout ${formatWorkoutDate(athlete.lastWorkoutOn)}`
                      : "No workouts yet"}
                  </span>
                </div>
                <Badge>
                  {athlete.workoutCount}{" "}
                  {athlete.workoutCount === 1 ? "workout" : "workouts"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
