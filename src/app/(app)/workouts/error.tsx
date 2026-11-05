"use client";

import { useEffect } from "react";

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
      className="flex flex-col items-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center dark:border-red-900 dark:bg-red-950"
    >
      <p className="text-red-800 dark:text-red-200">
        Couldn&apos;t load your workouts.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900"
      >
        Try again
      </button>
    </div>
  );
}
