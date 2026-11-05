import type { ReactNode } from "react";

const tones = {
  neutral: "border border-line text-muted",
  accent: "bg-accent-soft text-accent-text",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
