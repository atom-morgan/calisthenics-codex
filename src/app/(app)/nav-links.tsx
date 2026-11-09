"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };

/** Header links with the current section marked. */
export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex items-center gap-5 text-sm">
      {links.map((link) => {
        // Sections own their sub-pages: /workouts/new is still "Workouts".
        const current =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`border-b-2 py-1 transition-colors ${
              current
                ? "border-accent text-fg"
                : "border-transparent text-muted hover:text-fg"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
