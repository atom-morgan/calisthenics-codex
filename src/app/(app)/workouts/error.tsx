"use client";

import { useEffect } from "react";
import { LoadError } from "@/components/load-error";

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

  return <LoadError message="Couldn't load your workouts." retry={retry} />;
}
