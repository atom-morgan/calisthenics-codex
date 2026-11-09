"use client";

import { LoadError, type RouteErrorProps } from "@/components/load-error";

export default function WorkoutsError(props: RouteErrorProps) {
  return <LoadError {...props} message="Couldn't load your workouts." />;
}
