import { ProgressPanel } from "@/components/progress-panel";
import { requireUser } from "@/server/auth";

export default async function ProgressPage(props: PageProps<"/progress">) {
  const user = await requireUser();
  const { exercise } = await props.searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Progress</h1>
        <p className="text-sm text-muted">
          Your best set each session, per exercise.
        </p>
      </div>
      <ProgressPanel
        userId={user.id}
        exerciseId={typeof exercise === "string" ? exercise : undefined}
        basePath="/progress"
      />
    </div>
  );
}
