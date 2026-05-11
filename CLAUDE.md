# CLAUDE.md

This file governs how Claude works on this project. Load-bearing.

## 1. Engineering principles
Don't be lazy. Don't guess. Diagnose root causes before fixing — symptoms are evidence, not explanations. State unknowns as unknowns; never invent behavior.

## 2. Commits
- Never add `Co-Authored-By: Claude` (or any Claude/Anthropic co-author) trailers.
- `prism:ship` is the only commit tool. Use it for every commit — logical checkpoints and in-progress saves alike.
- Never `git add -A` or `git add .`. Stage files by name.
- Never push manually.

## 3. Stack — frozen
- Next.js 16 (App Router) · React 19
- TypeScript 6, `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- Zod 4 — sole validation library
- Tailwind CSS 4 + shadcn/ui (new-york style, neutral base)
- Vitest 4 + `@vitest/coverage-v8` + `@testing-library/react` + `@testing-library/user-event` + jsdom
- tsx — runs the TS CLI without a separate build step
- Biome 2 — lint and format
- pnpm

## 4. Layout — hexagonal-lite (ports & adapters)
- `lib/` — domain + application (pure, no I/O, no framework imports)
  - `lib/solve.ts` (domain: math)
  - `lib/parse.ts` (domain: Zod schemas + parser)
  - `lib/process.ts` (application: use case composing solve + parse)
  - `lib/utils.ts` (shadcn `cn` helper — coverage-excluded)
- `components/` — web adapter (`'use client'` React)
- `components/ui/` — vendored shadcn primitives (lint + coverage excluded)
- `scripts/` — CLI adapter (stdin/stdout glue, depends on `lib/process.ts`)
- `app/` — Next.js routing glue
- `tests/` — one spec per `lib/` module, one per `components/` component, one for the CLI

## 5. TypeScript
`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. No `any`, no `as` outside validated boundaries, no `!` non-null assertions. Explicit return types on exported functions. Discriminated unions for `ok`/`error` results. No barrel `index.ts` re-exports.

## 6. Validation
Zod is the only validator. Schemas live in `lib/parse.ts`, never inline in components. `z.infer<typeof X>` is the only DTO source — no parallel hand-typed interfaces.

## 7. Components
Server components by default. `'use client'` only when state, refs, or event handlers are needed. shadcn primitives are vendored as-is; do not edit `components/ui/`.

## 8. Testing
- Vitest. **100% coverage enforced** via `vitest.config.mts` thresholds (`lines`, `functions`, `branches`, `statements` all = 100).
- Coverage scope: `lib/**` + `components/nut-form.tsx` + `components/sample-legend.tsx`. Excluded: `components/ui/**`, `scripts/**` (behaviorally tested via `child_process` in `tests/cli.spec.ts`), `app/**`, `lib/utils.ts`.
- RTL + `user-event` for components. Never mock Zod. Never mock `solve()`.
- New code must ship with tests in the same commit.

## 9. Anti-patterns — never
- `any` or `as` outside validated boundaries
- `!` non-null assertions
- `console.log` in committed code (warn/error allowed)
- Commented-out code, unannotated TODOs, unused exports
- Barrel `index.ts` re-exports
- Inline Zod schemas in components
- Editing files under `components/ui/`

## 10. Definition of done
- `pnpm typecheck` clean
- `pnpm lint` clean (Biome)
- `pnpm test:coverage` green at 100/100/100/100
- `pnpm build` succeeds
- `pnpm dev` boots; canonical `10,100,1,10` returns ≈13.997 in the browser
- CLI smoke: `echo "10,100,1,10" | pnpm cli` prints `X = 13.997…`
- README has 6 sections filled
