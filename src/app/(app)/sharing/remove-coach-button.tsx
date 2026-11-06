"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

/** Submit button for the surrounding remove form, with a pending label. */
export function RemoveCoachButton({ coachName }: { coachName: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={`Remove ${coachName}`}
    >
      {pending ? "Removing…" : "Remove"}
    </Button>
  );
}
