"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function WorkoutsError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-danger/30 bg-danger-soft px-6 py-14 text-center"
    >
      <p className="text-danger">Couldn&apos;t load your workouts.</p>
      <Button variant="secondary" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
