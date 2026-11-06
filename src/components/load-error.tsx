import { Button } from "@/components/ui/button";

/** Body of a route's error.tsx: the message plus a retry button. */
export function LoadError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
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
