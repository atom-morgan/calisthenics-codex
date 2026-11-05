import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center rounded-md font-medium disabled:opacity-60";

const variants = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
  secondary:
    "border border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900",
  ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-900",
};

const sizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

/** Button classes, for elements that should look like a button (e.g. `<Link>`). */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return [base, variants[variant], sizes[size], className].join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
