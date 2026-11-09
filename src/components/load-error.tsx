"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export type RouteErrorProps = { error: unknown; retry: () => void };

/**
 * The whole body of a route's error.tsx: logs the error and shows the message
 * with a retry button. Next needs an error.tsx per segment, so each one only
 * supplies its message.
 */
export function LoadError({
  error,
  retry,
  message,
}: RouteErrorProps & { message: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-danger/30 bg-danger-soft px-6 py-14 text-center"
    >
      <p className="text-danger">{message}</p>
      <Button variant="secondary" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
