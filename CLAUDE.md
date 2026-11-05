# CLAUDE.md

## Project

Calisthenics workout logger with a coach view and natural-language entry. A 4-day portfolio build to demo in technical interviews. Read `PLAN.md` for the full plan and `DATA_MODEL.md` for the schema.

## Stack

- Next.js (App Router), React, TypeScript (strict)
- Tailwind CSS
- Postgres (Supabase) with Drizzle ORM
- Auth: Supabase Auth (`@supabase/ssr`)
- Zod for all validation (API inputs and LLM output)
- Anthropic API, server-side only
- Recharts for charts
- Vitest for tests
- GitHub Actions for CI, Vercel for deploys

## How to work with me

I'm an experienced front-end engineer (mostly Angular) returning to development after several years away. I'm learning the modern stack as I build, so:

- **Plan before coding.** At the start of each day's work, propose an approach and wait for my approval before implementing.
- **Explain as you go, in chat, not in code.** When you make an architectural choice (a library, a pattern, a file structure), say why and name the main alternative you rejected. Explanations meant for me belong in your response; lasting rationale goes in `docs/decisions.md`. Code comments are for a teammate (see Code standards).
- **Keep changes small.** One logical change per step, so I can review each diff. Don't touch unrelated files.
- **Commit often.** Small commits with clear messages (e.g., `feat: add workout form`, `test: cover parser edge cases`). Don't commit until I've reviewed the change.
- **Flag unfamiliar patterns.** If you use something that's new since ~2020 (server components, server actions, route handlers, etc.), add a one-line explanation in your response.
- **Tell me when you're unsure.** If a decision is a judgment call, say so rather than picking silently.
- **Log lessons as they happen.** When we hit a bug, a gotcha, or a framework change that contradicts older docs, add an entry to `docs/lessons.md` (problem, cause, fix, takeaway) in the same commit as the fix. Design choices go in `docs/decisions.md` instead.

## Code standards

- TypeScript strict mode; no `any` without a comment explaining why.
- Validate all external input (user forms, request bodies, LLM output) with Zod at the boundary.
- Never expose API keys or secrets to the client. LLM calls happen in server routes only. Keep secrets in `.env.local` and document required variables in `.env.example`.
- Enforce authorization on the server for every data access. Hiding UI is not access control.
- Prefer simple, readable code over clever abstractions. This is a small app.
- Handle loading, empty, and error states for any UI that fetches data.

### Comments

Write comments for a teammate who knows React, Next.js, and TypeScript, the way you would on a professional team.

- Comment **why**, not what: non-obvious decisions, security contracts (e.g. "`userId` must come from `requireUser()`"), workarounds, and gotchas.
- Don't explain framework behavior (what a Server Component or `loading.tsx` is) or restate the code.
- Short JSDoc (`/** ... */`) on exported functions whose contract isn't obvious from the signature.
- No references to the project plan ("Day 2") in code.
- Rationale longer than a couple of lines goes in `docs/decisions.md`, with a pointer from the code if needed.

### Conventions

- **Formatting:** Prettier (with `prettier-plugin-tailwindcss`) is the source of truth. Run `npm run format` before committing; never hand-format.
- **Imports:** packages, then `@/` aliases, then relative, each group alphabetical.
- **Files:** kebab-case file names; named exports, except where Next.js requires a default export (pages, layouts, `loading`, `error`).
- **Where code lives:**
  - `src/app/`: routes. Route-specific components and Server Actions sit next to the route that uses them.
  - `src/actions/`: Server Actions shared by more than one route group.
  - `src/server/`: data access and auth (`import "server-only"`). Every function takes the user id from `requireUser()`.
  - `src/components/ui/`: shared primitives (`Button`, `ErrorAlert`, `FieldError`, `Select`, `inputClasses`). Reuse them instead of copying class strings.
  - `src/lib/`: framework-agnostic helpers and Zod schemas (`lib/validation/`).
- **Components:** extract a component when a file mixes several concerns or passes ~150 lines. Use `useReducer` (with a pure, tested reducer) for related or nested state.
- **Server Actions:** treat input as `unknown` and validate with Zod; get the user from `requireUser()`; call `redirect()` outside `try/catch`.
- **Migrations:** generate with `npm run db:generate`; hand-edit only when needed (e.g. backfills) and explain why in the SQL. Never edit a migration that has been applied.

## Testing

- Write tests alongside the features that need them, especially:
  - the LLM parsing logic (messy inputs, malformed output, empty input, API failure)
  - authorization rules (an athlete cannot read another athlete's data; a coach can only read linked athletes)
- Run format, lint, typecheck, and tests before declaring a task done.

## Commands

- `npm run dev`: start the dev server
- `npm run build`: production build
- `npm run lint`: lint
- `npm run format` / `npm run format:check`: format with Prettier / check formatting
- `npm run typecheck`: generate Next route types (`next typegen`), then `tsc --noEmit`
- `npm test` / `npm run test:watch`: run Vitest once / in watch mode (tests live next to their source as `*.test.ts`)
- `npm run eval:parser -- [model ...]`: run the workout parser against the real API and score it (costs a few cents per model; not in CI)
- `npm run db:generate`: generate a SQL migration from `src/db/schema.ts` (no DB needed)
- `npm run db:migrate`: apply migrations (uses `MIGRATION_DATABASE_URL`)
- `npm run db:studio`: browse the database in Drizzle Studio
- `npm run db:seed`: seed the exercise list (idempotent; demo data comes on Day 4)

Next.js 16 ships its own docs in `node_modules/next/dist/docs/`; see `AGENTS.md`.

## Priorities if time runs short

Cut the progress chart first, then polish, then CI. Never cut auth, role-based access, or LLM output validation.