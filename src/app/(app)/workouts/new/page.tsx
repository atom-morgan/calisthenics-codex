import { requireUser } from "@/server/auth";
import { listExercises } from "@/server/exercises";
import { WorkoutForm } from "./workout-form";

export default async function NewWorkoutPage() {
  await requireUser();
  const exercises = await listExercises();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Log a workout</h1>
      <WorkoutForm exercises={exercises} />
    </div>
  );
}
