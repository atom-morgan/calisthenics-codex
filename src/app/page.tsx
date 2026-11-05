import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cardClasses } from "@/components/ui/card";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/server/auth";
import { LandingDemo } from "./landing-demo";

const FEATURES = [
  {
    title: "Type it like a note",
    body: "“3x8 pull-ups, 30s L-sit” becomes structured sets. You review everything before it’s saved.",
  },
  {
    title: "Coach view",
    body: "Coaches see the training history of the athletes linked to them, and nothing else.",
  },
  {
    title: "Clean history",
    body: "Every session in order, with sets, holds, and added weight at a glance.",
  },
];

export default async function Home() {
  if (await getCurrentUser()) redirect("/workouts");

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Wordmark />
        <Link
          href="/login"
          className={buttonClasses({ variant: "ghost", size: "sm" })}
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-4 py-12 sm:py-20">
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col items-start gap-6">
            <Badge tone="accent">Natural-language logging</Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Log your training the way you’d{" "}
              <span className="text-accent-text">text it</span>.
            </h1>
            <p className="max-w-md text-lg text-muted">
              A calisthenics workout log for athletes and their coaches. Type a
              session in plain English and get structured sets back.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={buttonClasses({ pill: true })}>
                Get started
              </Link>
              <Link
                href="/login"
                className={buttonClasses({ variant: "secondary", pill: true })}
              >
                Log in
              </Link>
            </div>
          </div>
          <LandingDemo />
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`${cardClasses} flex flex-col gap-2 p-5`}
            >
              <h2 className="font-semibold tracking-tight">{feature.title}</h2>
              <p className="text-sm text-muted">{feature.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line bg-page">
        <p className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
          Built with Next.js, Supabase, and Claude.
        </p>
      </footer>
    </div>
  );
}
