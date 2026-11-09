"use client";

import { LoadError, type RouteErrorProps } from "@/components/load-error";

export default function ProgressError(props: RouteErrorProps) {
  return <LoadError {...props} message="Couldn't load your progress." />;
}
