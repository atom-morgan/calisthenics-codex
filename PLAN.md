# Calisthenics Workout Logger: Project Plan

A workout logging app for calisthenics athletes, with a coach view and natural-language entry. Built over 4 days as a portfolio project to demo in technical interviews.

## Goals

- Show a modern full-stack workflow end to end: typed code, auth and roles, a database, an LLM integration, tests, CI, and deployment.
- Produce a project I can demo live and walk through in about 5 minutes.
- Understand every file in the repo well enough to explain it. AI tools write code, but I review and own every diff.

## Stack

- **Framework:** Next.js (App Router), React, TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database:** Postgres (Supabase or Neon) with Drizzle ORM (or Prisma)
- **Auth:** Supabase Auth or Clerk
- **Validation:** Zod (API inputs and LLM output)
- **LLM:** Anthropic API, called from a server route only (the key never reaches the client)
- **Charts:** Recharts
- **Testing:** Vitest (unit and integration)
- **CI/CD:** GitHub Actions (lint, typecheck, test) and Vercel (deploy on push)

## Core Features

1. Log workouts manually: exercises, sets, reps, optional notes
2. Natural-language entry: "3x8 pull-ups, 2x12 dips" is parsed into structured sets, previewed, then saved
3. Roles: athlete and coach, with a coach linked to many athletes
4. Coach view: list of athletes and each athlete's recent logs (read-only)
5. Progress chart per exercise over time

## Data Model (draft)

- `users`: id, email, name, role (`athlete` | `coach`)
- `coach_athletes`: coach_id, athlete_id
- `exercises`: id, name (seeded list plus user-created)
- `workouts`: id, user_id, date, notes
- `sets`: id, workout_id, exercise_id, set_number, reps, weight_lb (nullable), duration_sec (nullable)

## Day-by-Day

### Day 1: Foundation and logging
- [ ] Scaffold Next.js + TypeScript + Tailwind, push to GitHub
- [ ] Deploy to Vercel immediately (deploy early, deploy often)
- [ ] Set up Postgres and the ORM, create the schema, run migrations
- [ ] Add auth: sign up, log in, log out, protected routes
- [ ] Build the manual workout form and the workout history list
- [ ] Add a seed script for exercises

### Day 2: LLM entry
- [ ] Server route that sends free text to the LLM and requests JSON only
- [ ] Zod schema for the parsed result; reject and handle malformed output
- [ ] Handle API errors, timeouts, and empty input gracefully
- [ ] Preview-and-confirm UI before saving parsed sets
- [ ] Tests for messy inputs ("pullups 8/8/6", "did some dips", empty string, nonsense)

### Day 3: Roles and coach view
- [ ] Add roles and the coach-to-athlete link
- [ ] Coach dashboard: athlete list, then each athlete's recent workouts
- [ ] Enforce authorization on the server (not just by hiding UI)
- [ ] Tests proving an athlete cannot read another athlete's data, and a coach can only read linked athletes

### Day 4: Polish and interview prep
- [ ] Progress chart per exercise
- [ ] Loading, empty, and error states; mobile layout pass
- [ ] CI workflow: lint, typecheck, tests
- [ ] Seed realistic demo data so the live demo isn't empty
- [ ] README: architecture overview, key decisions, "what I'd do next"
- [ ] Practice the 5-minute walkthrough out loud

## Working Rules

- Work one day at a time; plan first, then implement.
- Small, focused commits with clear messages.
- Review every diff before accepting it. Be able to explain each file.
- Ask "why this approach over the alternatives?" for each architectural choice.
- Never expose API keys client-side; validate all external input (user and LLM) with Zod.

## If Time Runs Short

Cut in this order: progress chart, then polish and mobile layout, then CI. Never cut auth, role-based access, or LLM output validation. Those are the strongest interview talking points.

## Interview Talking Points

- Why server-side authorization matters, and how I tested it
- How I handle unreliable LLM output (schema validation, preview step, error paths)
- Data modeling decisions (sets as rows, the coach-athlete link table)
- Tradeoffs I made given the 4-day scope, and what I'd build next