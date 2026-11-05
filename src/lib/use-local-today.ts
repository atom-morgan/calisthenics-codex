"use client";

import { useSyncExternalStore } from "react";

// Today's date in the user's timezone, as "YYYY-MM-DD".
//
// The server can't know the user's timezone (Vercel runs on UTC), and if the
// server rendered one date and the browser another, React would report a
// hydration mismatch. useSyncExternalStore handles that: during server render
// and hydration it uses getServerSnapshot (""), then immediately re-renders
// with the browser's value.
function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const subscribe = () => () => {}; // The date doesn't need live updates.

export function useLocalToday(): string {
  return useSyncExternalStore(subscribe, localToday, () => "");
}
