# Lessons

Bugs, gotchas, and surprises hit while building this, with the cause, the fix, and the general rule. Design choices live in [decisions.md](decisions.md); this file is for things that went wrong or weren't what we expected.

## Bugs and gotchas

### 1. Zod runs checks in chain order

**Problem:** `z.email().trim().toLowerCase()` rejected `" adam@example.com"` as an invalid email instead of trimming it. Mobile keyboards often add a trailing space after autocompleting an email, so real users would have hit this.

**Cause:** In Zod 4, checks and transforms run in the order they're chained. The email format check ran before `.trim()`.

**Fix:** Normalize first, then validate: `z.string().trim().toLowerCase().pipe(z.email())` in [`validation/auth.ts`](../src/lib/validation/auth.ts). Found by the first unit test written for the schema.

**Takeaway:** With any validation library, check whether normalization happens before or after validation. Write a test with messy input (whitespace, mixed case), not just clean and obviously invalid values.

### 2. A copied Supabase URL with `/rest/v1/` broke auth

**Problem:** Signup failed with `AuthApiError: Invalid path specified in request URL`.

**Cause:** The Supabase dashboard's Data API page shows the URL as `https://<ref>.supabase.co/rest/v1/`. The auth client expects only the base URL and appends its own paths.

**Fix:** [`supabase/env.ts`](../src/lib/supabase/env.ts) validates environment variables with Zod at startup and rejects a URL with a path, with a message that says exactly what's wrong.

**Takeaway:** Validate configuration at startup with specific error messages. A vague runtime error far from the cause is much slower to debug than a clear failure at boot.

### 3. Postgres `now()` is the transaction's start time

**Problem:** Workout history couldn't show exercises in the order they were logged.

**Cause:** All sets are inserted in one transaction, and `now()` (behind `DEFAULT now()`) returns the transaction start time, so every set in a save had the same `created_at`. Random UUID primary keys don't preserve insertion order either. Nothing recorded the order.

**Fix:** Added `sets.exercise_position`, assigned by the server from array order (commit `5aca110`).

**Takeaway:** If order matters, store it explicitly. Don't rely on timestamps or IDs to imply it. (`clock_timestamp()` gives the actual wall-clock time if you need it.)

### 4. `ADD COLUMN ... NOT NULL` fails on a table with rows

**Problem:** The migration drizzle-kit generated for `exercise_position` would have failed, since `sets` already had rows.

**Cause:** Postgres can't add a `NOT NULL` column without a default to a table with existing rows: they'd have no value.

**Fix:** Hand-edited the migration to add the column as nullable, backfill it, then `SET NOT NULL` ([`0002_sets_exercise_position.sql`](../drizzle/0002_sets_exercise_position.sql)).

**Takeaway:** Review generated migrations before running them. "Add nullable, backfill, tighten" is the standard pattern for adding required columns to live tables. Never edit a migration after it has been applied.

### 5. `new Date("2026-11-04")` is the wrong day in the US

**Problem:** A workout on Nov 4 would display as Nov 3 for US users.

**Cause:** A date-only ISO string is parsed as midnight UTC. Formatting it in a timezone behind UTC moves it to the previous day.

**Fix:** [`format.ts`](../src/lib/format.ts) builds the date with `Date.UTC` and formats with `timeZone: "UTC"`. The test runs with `TZ=America/Los_Angeles` to prove it.

**Takeaway:** A calendar day isn't an instant. Store it as `date`, keep it as a `YYYY-MM-DD` string, and never pass it through local time.

### 6. The server and browser disagree about "today"

**Problem:** Defaulting the workout form's date to today risked a hydration mismatch, and on the server it would be the wrong date for US evenings.

**Cause:** The server (UTC on Vercel) renders the HTML; the browser knows the user's timezone. Different values in server HTML and the first client render is a hydration mismatch.

**Fix:** [`use-local-today.ts`](../src/lib/use-local-today.ts) uses `useSyncExternalStore`: the server and hydration render `""`, then React re-renders with the browser's date.

**Takeaway:** Anything that depends on the browser (timezone, locale, `window`, screen size) needs a hydration-safe pattern. `useEffect(() => setState(...))` works but is now flagged by React's lint rules.

### 7. The remove-set button was invisible until hovered

**Problem:** The × button next to each set showed only as a gray box on hover.

**Cause:** It had no fixed size, so it shrank to a small, light text glyph.

**Fix:** A fixed `size-10` button matching the input height, with an SVG icon and a red destructive hover state (commit `c033a19`).

**Takeaway:** Icon-only buttons need an explicit size, a visible icon, and an `aria-label`. Check how interactive elements look *before* hover, not just during it.

### 8. Peer dependency conflict installing Vitest

**Problem:** `npm install vitest` failed with `ERESOLVE`: Vitest 5 wants `@types/node` 22 or later, but the Next.js template pinned `^20`.

**Fix:** Upgraded `@types/node` to `^24` to match the Node 24 runtime, and added `"engines": { "node": "24.x" }` so Vercel uses the same version.

**Takeaway:** Fix peer conflicts by aligning versions with reality. `--legacy-peer-deps` or `--force` hides the conflict and leaves mismatched types or broken installs.

## Security

### 9. Supabase exposes your tables over a public REST API

**Problem:** With RLS off, anyone holding the publishable (anon) key, which is meant to be public, could read and write every table through Supabase's auto-generated REST API, bypassing the app entirely.

**Fix:** RLS enabled on every table with **no policies** ([`schema.ts`](../src/db/schema.ts)), which blocks the REST API completely. The app connects as the `postgres` role, which bypasses RLS. Verified by querying the REST API as a logged-in user and getting zero rows.

**Takeaway:** Know what your platform exposes by default. On Supabase, a table in `public` without RLS is a public API.

### 10. `getSession()` doesn't verify anything

**Problem:** The obvious way to read the user on the server, `supabase.auth.getSession()`, returns whatever is in the cookie without checking it.

**Fix:** [`server/auth.ts`](../src/server/auth.ts) and [`proxy.ts`](../src/proxy.ts) use `getClaims()`, which verifies the JWT signature.

**Takeaway:** Cookies are user input. On the server, use the API that verifies the token. Read the security notes in an auth library's docs, not just the quickstart.

### 11. Layout checks and Proxy aren't access control

**Problem:** It's tempting to check auth once in a shared layout or in Proxy and consider every page below it protected.

**Cause:** Layouts don't re-render on every client-side navigation. Proxy matches URL paths, and Server Actions are POST endpoints that can be called directly.

**Fix:** Every page and Server Action calls `requireUser()`, and every data function filters by the user id it returns. Proxy only handles redirects and session refresh.

**Takeaway:** Put authorization next to the data, not at the edge of the UI. See [decisions.md](decisions.md#4-proxy-is-an-optimistic-check-only).

## Framework changes that don't match older tutorials

### 12. Next.js 16

- `middleware.ts` is now **`proxy.ts`** (exported function `proxy`).
- `error.tsx` receives **`retry()`** (re-fetches and re-renders) and `error: unknown`, not `reset()` and `error: Error`.
- The `create-next-app` template enables **`cacheComponents`**, which changes how pages that read cookies must be written. We turned it off ([decisions.md](decisions.md#7-nextjs-cache-components-are-off)).
- Global types like **`LayoutProps`** are generated: run `next typegen` before `tsc` (our `typecheck` script does).
- Only **one `next dev`** can run per project directory.
- Next ships version-matched docs in `node_modules/next/dist/docs/`. They're more reliable than search results for a new major version.

### 13. React 19

- A `<form action={fn}>` **resets the form** after the action runs. To keep what the user typed after a failed submit, return it from the action and use it as `defaultValue` (see `values` in [`auth-form.tsx`](../src/app/(auth)/auth-form.tsx)).
- **`FormEvent` is deprecated.** Use `SubmitEvent` for `onSubmit`, `ChangeEvent` for `onChange`.
- Next's **`redirect()` works by throwing**, so it must be called outside `try/catch`.
- **`useActionState`** gives `[state, action, pending]`. When calling the action manually rather than through `<form action>`, wrap it in `startTransition` or `pending` won't update.

### 14. Supabase's transaction pooler doesn't support prepared statements

**Problem:** postgres.js uses prepared statements by default, which Supabase's transaction pooler (port 6543, the one meant for serverless) doesn't support.

**Fix:** `prepare: false` in [`db/index.ts`](../src/db/index.ts). Migrations use the session pooler (port 5432) instead ([decisions.md](decisions.md#8-two-database-connection-strings)).

**Takeaway:** Connection poolers change what the database supports. Check the pooler's limitations before choosing a driver configuration.

## LLM integration

### 15. Strict structured-output schemas throw away whole responses

**Problem:** The natural move is to give the model the same strict schema the form uses (`reps: int().min(1).max(1000)`), so the output is "guaranteed valid".

**Cause:** The API's structured outputs can't enforce numeric or length constraints, so the SDK removes them from the schema it sends and checks them client-side after the response arrives. `messages.parse` then **throws** on any mismatch: one bad set loses every exercise in the response.

**Fix:** The schema sent to the model only fixes the shape ([`workout-parser/schema.ts`](../src/lib/workout-parser/schema.ts)). [`parse.ts`](../src/lib/workout-parser/parse.ts) then validates each set with the form's own `setInputSchema`, keeps the good ones, and turns the rest into warnings for the preview.

**Takeaway:** Structured output guarantees parseable JSON of the right shape, not correct values. Validate LLM output yourself, at a granularity where one bad value doesn't discard the good ones. Found by reading the SDK source, not the docs.
