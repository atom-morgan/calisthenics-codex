"use client";

import { useSyncExternalStore } from "react";

// The server doesn't know the user's timezone, so it renders "" and the client
// fills in the local date after hydration (avoiding a hydration mismatch).
function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const subscribe = () => () => {};

/** Today's date in the user's timezone (YYYY-MM-DD), or "" on the server. */
export function useLocalToday(): string {
  return useSyncExternalStore(subscribe, localToday, () => "");
}
