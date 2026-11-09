import type { ButtonHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-accent text-accent-fg hover:bg-accent/85",
  secondary: "border border-line-strong text-fg hover:bg-fg/5",
  ghost: "text-muted hover:bg-fg/5 hover:text-fg",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-11 px-5 text-sm",
};

type Variant = keyof typeof variants;
type Size = keyof typeof sizes;

type ButtonStyle = {
  variant?: Variant;
  size?: Size;
  /** Fully rounded, for marketing calls to action. */
  pill?: boolean;
  className?: string;
};

/** Button classes, for elements that should look like a button (e.g. `<Link>`). */
export function buttonClasses({
  variant = "primary",
  size = "md",
  pill = false,
  className = "",
}: ButtonStyle = {}) {
  return [
    base,
    variants[variant],
    sizes[size],
    pill ? "rounded-full" : "rounded-lg",
    className,
  ].join(" ");
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle;

export function Button({
  variant,
  size,
  pill,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, pill, className })}
      {...props}
    />
  );
}
