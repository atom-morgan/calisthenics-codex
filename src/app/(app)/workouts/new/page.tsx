import { requireUser } from "@/server/auth";
import { listExercises } from "@/server/exercises";
import { WorkoutForm } from "./workout-form";

export default async function NewWorkoutPage() {
  await requireUser();
  const exercises = await listExercises();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Log a workout</h1>
        <p className="text-sm text-muted">
          Type it the way you would in a notes app, or fill in the form.
        </p>
      </div>
      <WorkoutForm exercises={exercises} />
    </div>
  );
}
