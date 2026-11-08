import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ProgressPanel } from "@/components/progress-panel";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { WorkoutList } from "@/components/workout-list";
import { requireUser } from "@/server/auth";
import { listAthleteWorkoutsForCoach } from "@/server/coaching";

export default async function AthletePage(props: PageProps<"/athletes/[id]">) {
  const user = await requireUser();
  const id = z.uuid().safeParse((await props.params).id);
  const { exercise } = await props.searchParams;
  if (!id.success) notFound();

  // Null unless this athlete added this coach: same 404 as a missing athlete.
  const result = await listAthleteWorkoutsForCoach(user.id, id.data);
  if (!result) notFound();
  const { athlete, workouts } = result;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4">
        <Link
          href="/athletes"
          className={buttonClasses({
            variant: "secondary",
            size: "sm",
            className: "pl-2",
          })}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          All athletes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {athlete.name}
          </h1>
          <Badge>Read only</Badge>
        </div>
      </div>

      {workouts.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Progress</h2>
          <ProgressPanel
            // athlete.id comes from the coach access check above.
            userId={athlete.id}
            exerciseId={typeof exercise === "string" ? exercise : undefined}
            basePath={`/athletes/${athlete.id}`}
          />
        </section>
      )}

      {workouts.length > 0 && (
        <h2 className="text-lg font-semibold tracking-tight">
          Recent workouts
        </h2>
      )}
      {workouts.length === 0 ? (
        <p
          className={`${cardClasses} border-dashed px-6 py-14 text-center text-sm text-muted`}
        >
          {athlete.name} hasn&apos;t logged any workouts yet.
        </p>
      ) : (
        <WorkoutList workouts={workouts} />
      )}
    </div>
  );
}
