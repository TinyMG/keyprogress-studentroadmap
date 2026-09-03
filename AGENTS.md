# KeyProgress — agent notes

Single-page app: Vite + React 18 + TypeScript + Tailwind. Music teachers
track students through piano book series. No backend server — Supabase
(Postgres + RLS + email auth) for DB/auth, EmailJS for client-side email.

## Working mode

Ponytail (lazy-senior) is active via the `@dietrichgebert/ponytail`
opencode plugin. Defaults: shortest working diff, reuse before re-write,
no unrequested abstractions, no new deps. Mark deliberate shortcuts with
a `ponytail:` comment naming the ceiling + upgrade path. Don't strip
existing `ponytail:` notes — they're the debt ledger.

## Commands

```
npm run dev       # vite dev server
npm run build     # tsc -b && vite build  — THIS is the typecheck+build;
                  #   fails on any TS error. No separate lint/typecheck.
npm run check     # node --experimental-strip-types src/logic/progress.test.ts
                  #   the ONLY test; Node 24+ strips TS natively, no framework.
```

No lint script, no eslint/prettier, no CI workflow. Don't assume one.
`npm run build` is the gate: `tsc -b` (project refs) runs before
`vite build`, so type errors block the build. Run it before declaring done.

## Env

All vars are `VITE_*` (Vite), read via `import.meta.env` — never
`process.env`. See `.env.example`:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`,
`VITE_EMAILJS_PUBLIC_KEY`.

## Architecture

- `src/App.tsx` — root; gates on Supabase session, renders `Auth` or
  `StudentList` / `StudentDetail`.
- `src/lib/supabase.ts` — all DB calls + `Student`/`StudentBookRow` types.
  Silently no-ops without env (warns, doesn't crash at module load);
  don't "fix" the empty-string client.
- `src/lib/email.ts` — EmailJS client-side send (200/mo free tier).
- `src/lib/error.ts` — `errorMessage(err)`: coerces Supabase errors
  (plain objects with `.message`, NOT `Error`) to string. REUSE this;
  `String(err)` renders `[object Object]`.
- `src/logic/progress.ts` — `deriveProgress`, pure, the one non-trivial
  logic. Self-check lives in `progress.test.ts`.
- `src/data/books.ts` — series as a static const (4 series). Don't add a
  books DB table; `ponytail:` note says migrate only when the school
  needs editable series.
- `supabase/schema.sql` — DB schema + RLS. Run in Supabase SQL editor;
  no migration tool.

## Security boundary (important)

RLS, not app code, enforces "each teacher sees only their own students."
A `before insert` trigger stamps `teacher_id` from `auth.uid()` — the
CLIENT NEVER sends `teacher_id`. If you add a column to `students` or a
new table, add/match the RLS policy or rows become invisible. Re-run
`supabase/schema.sql` in the Supabase SQL editor after schema changes.

`student_books`: presence = completed, absence = not done. `status` is
always `'completed'` (`ponytail:` note: collapse the column if no other
states ever appear). Don't introduce other statuses.

## Conventions

- Error display in components:
  `try { ... } catch (err) { setError(errorMessage(err)) }`.
- Optimistic UI then revert-on-error via reload (see `StudentDetail.toggle`).
- Tailwind palette: `brand-500/600/700` + `done`/`current`/`goal`
  semantic colors (`tailwind.config.js`). Use these, don't invent new ones.
- Non-trivial new logic gets a runnable self-check (assert-based
  `*.test.ts` run via `node --experimental-strip-types`), not a test
  framework. Trivial one-liners need no test.

## Gotchas

- `vite.config.ts` is the real config; `vite.config.js` is a stale
  duplicate — edit `.ts`, not `.js`.
- `tsconfig.app.json` excludes `*.test.ts`, so `tsc` won't typecheck test
  files — they're validated only by running `npm run check`.
- No test framework is installed; `progress.test.ts` uses
  `node:assert/strict` and imports `./progress.ts` with the `.ts`
  extension (Node 24 native type stripping).
- Deploy = `npm run build` → `dist/` → Cloudflare Pages (set env vars in
  the dashboard). No CI.
