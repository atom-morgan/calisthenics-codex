"use client";

import { LoadError, type RouteErrorProps } from "@/components/load-error";

export default function AthletesError(props: RouteErrorProps) {
  return <LoadError {...props} message="Couldn't load your athletes." />;
}
