# CLAUDE.md

## Project

Calisthenics workout logger with a coach view and natural-language entry. A 4-day portfolio build to demo in technical interviews. Read `PLAN.md` for the full plan and `DATA_MODEL.md` for the schema.

## Stack

- Next.js (App Router), React, TypeScript (strict)
- Tailwind CSS
- Postgres (Supabase or Neon) with Drizzle ORM
- Auth: Supabase Auth or Clerk
- Zod for all validation (API inputs and LLM output)
- Anthropic API, server-side only
- Recharts for charts
- Vitest for tests
- GitHub Actions for CI, Vercel for deploys

## How to work with me

I'm an experienced front-end engineer (mostly Angular) returning to development after several years away. I'm learning the modern stack as I build, so:

- **Plan before coding.** At the start of each day's work, propose an approach and wait for my approval before implementing.
- **Explain as you go.** When you make an architectural choice (a library, a pattern, a file structure), say why and name the main alternative you rejected.
- **Keep changes small.** One logical change per step, so I can review each diff. Don't touch unrelated files.
- **Commit often.** Small commits with clear messages (e.g., `feat: add workout form`, `test: cover parser edge cases`). Don't commit until I've reviewed the change.
- **Flag unfamiliar patterns.** If you use something that's new since ~2020 (server components, server actions, route handlers, etc.), add a one-line explanation in your response.
- **Tell me when you're unsure.** If a decision is a judgment call, say so rather than picking silently.

## Code standards

- TypeScript strict mode; no `any` without a comment explaining why.
- Validate all external input (user forms, request bodies, LLM output) with Zod at the boundary.
- Never expose API keys or secrets to the client. LLM calls happen in server routes only. Keep secrets in `.env.local` and document required variables in `.env.example`.
- Enforce authorization on the server for every data access. Hiding UI is not access control.
- Prefer simple, readable code over clever abstractions. This is a small app.
- Handle loading, empty, and error states for any UI that fetches data.

## Testing

- Write tests alongside the features that need them, especially:
  - the LLM parsing logic (messy inputs, malformed output, empty input, API failure)
  - authorization rules (an athlete cannot read another athlete's data; a coach can only read linked athletes)
- Run lint, typecheck, and tests before declaring a task done.

## Commands

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run lint`: lint
- `npm run typecheck`: generate Next route types (`next typegen`), then `tsc --noEmit`
- `npm test`: run tests (not yet set up)
- `npm run db:generate`: generate a SQL migration from `src/db/schema.ts` (no DB needed)
- `npm run db:migrate`: apply migrations (uses `MIGRATION_DATABASE_URL`)
- `npm run db:studio`: browse the database in Drizzle Studio
- `npm run db:seed`: seed exercises and demo data (not yet set up)

Next.js 16 ships its own docs in `node_modules/next/dist/docs/`; see `AGENTS.md`.

## Priorities if time runs short

Cut the progress chart first, then polish, then CI. Never cut auth, role-based access, or LLM output validation.