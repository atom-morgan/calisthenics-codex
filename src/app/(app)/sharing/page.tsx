import { cardClasses } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { listCoachesForAthlete } from "@/server/coaching";
import { removeCoachAction } from "./actions";
import { AddCoachForm } from "./add-coach-form";
import { RemoveCoachButton } from "./remove-coach-button";

export default async function SharingPage() {
  const user = await requireUser();

  const header = (
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-semibold tracking-tight">Sharing</h1>
      <p className="text-sm text-muted">
        Coaches you add can see your workout history. They can&apos;t change it,
        and you can remove them at any time.
      </p>
    </div>
  );

  if (user.role !== "athlete") {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p className={`${cardClasses} p-5 text-sm text-muted`}>
          Sharing is for athletes. Athletes add you from their own Sharing page,
          using your email: {user.email}
        </p>
      </div>
    );
  }

  const coaches = await listCoachesForAthlete(user.id);

  return (
    <div className="flex flex-col gap-6">
      {header}

      <section className={`${cardClasses} flex flex-col gap-4 p-5`}>
        <h2 className="font-semibold tracking-tight">Your coaches</h2>
        {coaches.length === 0 ? (
          <p className="text-sm text-muted">
            You haven&apos;t added a coach yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {coaches.map((coach) => (
              <li
                key={coach.id}
                className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{coach.name}</span>
                  <span className="text-xs text-muted">{coach.email}</span>
                </div>
                <form action={removeCoachAction}>
                  <input type="hidden" name="coachId" value={coach.id} />
                  <RemoveCoachButton coachName={coach.name} />
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={`${cardClasses} p-5`}>
        <AddCoachForm />
      </section>
    </div>
  );
}
