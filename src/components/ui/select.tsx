import type { SelectHTMLAttributes } from "react";
import { inputClasses } from "./input";

/**
 * A native select with its own chevron: browsers draw the default arrow flush
 * against the edge and ignore padding.
 */
export function Select({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputClasses} appearance-none pr-10 ${className}`}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-zinc-500"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
