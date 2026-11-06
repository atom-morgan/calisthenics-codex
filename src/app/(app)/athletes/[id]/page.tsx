import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { cardClasses } from "@/components/ui/card";
import { WorkoutList } from "@/components/workout-list";
import { requireUser } from "@/server/auth";
import { listAthleteWorkoutsForCoach } from "@/server/coaching";

export default async function AthletePage(props: PageProps<"/athletes/[id]">) {
  const user = await requireUser();
  const id = z.uuid().safeParse((await props.params).id);
  if (!id.success) notFound();

  // Null unless this athlete added this coach: same 404 as a missing athlete.
  const result = await listAthleteWorkoutsForCoach(user.id, id.data);
  if (!result) notFound();
  const { athlete, workouts } = result;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/athletes"
          className="text-sm text-muted transition-colors hover:text-fg"
        >
          ← Athletes
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {athlete.name}
          </h1>
          <Badge>Read only</Badge>
        </div>
      </div>

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
