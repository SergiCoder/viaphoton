# viaPhoton — Sergi Coderch's submission

This repository is my full submission for the viaPhoton exercise. It answers **all three questions** from the brief:

1. **The Jeep / Desert-Crossing nut transport problem** — implemented end-to-end in this repo, with a Next.js web UI, a Node CLI, and a 100%-covered test suite.
2. **A piece of code I'm proud of** — the recurring-schedule (RRULE) engine I wrote for [`brandtrack`](https://github.com/SergiCoder/brandtrack), with a brief code-reviewer's pass.
3. **My preferred processes / methodologies / tools** for building from scratch and for evolving existing products — bullet-point scaffolding, expanded inline.

**Stack of this submission**: Next.js 16 · React 19 · TypeScript 6 (strict) · Zod 4 · Tailwind 4 · shadcn/ui · Vitest 4 · Biome 2 · pnpm
**Quality bar**: 51 tests · 100% coverage (lines/branches/functions/statements) · typecheck + lint clean

---

# Question 1 — The Jeep Problem

## 1.1 What it does

Given `D`, `N`, `F`, `C` (distance in km, pile size in kg, fuel rate in kg/km, cart capacity in kg), compute `X` — the **maximum kilograms of nuts deliverable to the town**. The brief's hint, *"`X > 0` even if `D·F > C`"*, is the trap: it forces you to recognise this as the Jeep Problem and implement a **staged-depot shuttle**, not a naive subtraction.

Two entry points share one pure core:

| Adapter      | Entry point            | Purpose                                        |
|--------------|------------------------|------------------------------------------------|
| Web (UI)     | `app/page.tsx`         | Textarea + buttons in a Next.js App Router page |
| CLI (stdio)  | `scripts/cli.ts`       | `stdin` → `stdout`, no Next.js needed           |

## 1.2 Run it

### Web UI

```bash
pnpm install
pnpm dev                 # http://localhost:3000
```

Click **Load sample** → **Compute** to see all corner cases, including the canonical trap `10,100,1,10 → X ≈ 13.998`.

### CLI

```bash
echo "10,100,1,10" | pnpm cli           # one-shot
pnpm cli < input.txt                    # batch of lines
```

### Other scripts

| Script               | What it does                              |
|----------------------|-------------------------------------------|
| `pnpm test`          | Run the Vitest suite                       |
| `pnpm test:coverage` | Run tests with the 100% coverage gate      |
| `pnpm typecheck`     | `tsc --noEmit` against strict TS config    |
| `pnpm lint`          | Biome (lint only)                          |
| `pnpm format`        | Biome (lint + format with `--write`)       |
| `pnpm build`         | Production Next.js build                   |
| `pnpm start`         | Serve the production build                 |

## 1.3 Algorithm

### The trap

The horse burns `F` kg/km **from the cart's contents** regardless of load. A naive answer like `X = max(0, N − D·F)` fails the moment a single load can't reach the town (`D·F > C`). The correct play is a **staged-depot shuttle**: drive forward, deposit, drive back empty (cart fuel reserves cover the return), reload, repeat.

### The recursion

At position `p` with remaining mass `m`, let `k = ⌈m / C⌉` (trips required). Advancing `k` loads by distance `d` requires `k` forward + `(k−1)` return = `2k − 1` traversals, consuming `(2k − 1) · F · d` kg.

```
d_k = (m − (k − 1) · C) / ((2k − 1) · F)
```

This is the distance that consumes exactly **one full load**, leaving `(k − 1)` full loads at the new depot. Recurse until `mass ≤ C`, then drive the final leg one-way.

### The anchor

```ts
solve(10, 100, 1, 10) ≈ 13.997665904786647
```

A correct implementation produces ≈ 14 here, **not 0**. This single number distinguishes the staged-shuttle solution from every naive variant — the test suite pins it as a closed-form cross-check, not a literal value.

### Architecture — hexagonal-lite

```
┌──────────────────────────────────────────────────────────────┐
│ ADAPTERS (driving side, I/O-aware)                           │
│  ┌─────────────────────────┐   ┌─────────────────────────┐   │
│  │ components/nut-form.tsx │   │ scripts/cli.ts          │   │
│  │ (web: React + DOM)      │   │ (cli: stdin/stdout)     │   │
│  └────────────┬────────────┘   └────────────┬────────────┘   │
└───────────────┼─────────────────────────────┼────────────────┘
                ▼                             ▼
┌──────────────────────────────────────────────────────────────┐
│ APPLICATION (use cases, framework-agnostic)                  │
│  lib/process.ts: processInput(text) → ResultLine[]           │
│                  formatResults(results) → string             │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│ DOMAIN (pure)                                                │
│  lib/solve.ts: solve(D,N,F,C) → number   (the math)          │
│  lib/parse.ts: ParamsSchema (Zod) + parseLine() → ParsedLine │
└──────────────────────────────────────────────────────────────┘
```

`lib/` has zero I/O and zero framework imports. Function signatures are the ports — no `interface SolveUseCase` ceremony for a 35-line algorithm.

## 1.4 Decisions and tradeoffs

| Choice                          | Why                                                                                                |
|---------------------------------|----------------------------------------------------------------------------------------------------|
| **Next.js 16 + TS strict**      | Modern stack literacy. Strict TS makes input/output types load-bearing, not aspirational.          |
| **Zod 4 as the only validator** | A competing submission's parser bug (returning `0` on any CSV input) is exactly what Zod prevents. |
| **shadcn/ui (new-york / neutral)** | Zero hand-rolled UI primitives, polish without bespoke CSS. Vendored — excluded from coverage. |
| **Hexagonal-lite layout**       | `lib/` pure, `components/` + `scripts/` are adapters. No DI container for a 35-line algorithm.     |
| **No `react-hook-form`**        | One textarea, one submit. A form library would be added surface area to cover for zero gain.       |
| **CLI alongside web UI**        | Spec says command-line *or* textarea. Offering both is ~10 lines of glue over `lib/process.ts`.    |
| **100% coverage gated**         | Enforced in `vitest.config.mts`. Drops fail the run — not aspirational.                            |
| **Biome over ESLint + Prettier**| Single tool, single config, faster.                                                                |

## 1.5 What's missing / what I'd do with more time

- **Playwright E2E** covering the dev server end-to-end, not just the React tree under jsdom.
- **Streaming validation feedback** as the user types (debounced parse on input).
- **Property-based tests** with `fast-check` — random `(D, N, F, C)` checking invariants (monotone in `N`, scaling identity, non-negative output).
- **A11y audit** beyond the obvious labels and roles.
- **Containerised run target** — multi-stage Dockerfile + compose for a one-command demo.
- **i18n** if the audience extends beyond English.

## 1.6 AI usage notes

**Kept as-is from AI**
- shadcn primitive scaffolding via `pnpm dlx shadcn@latest add button textarea card label`.
- Boilerplate around `vitest.config.mts`, `biome.json`, `postcss.config.mjs`.

**Hand-derived (not delegated)**
- The staged-depot recursion in `lib/solve.ts` and the closed-form cross-check used in tests.
- The corner-case battery (degenerate guards, single-trip regime, canonical trap, hint case, impossible-at-scale, scaling identity).
- The hexagonal-lite layering decision.
- The 100% coverage strategy — including restructuring `solve.ts` to drop one provably-unreachable branch rather than papering it over with `c8 ignore`.

**Rejected during the build**
- Mocking Zod or `solve()` in component tests — the whole point of integration-style component tests is that they exercise the real validator and the real solver. Mocking either would invalidate the trap-detector assertion.
- Inline Zod schemas inside components.
- `Co-Authored-By: Claude` trailers in commits (see `CLAUDE.md` §2).

---

# Question 2 — A piece of code I'm proud of

## 2.1 The code

The recurring-schedule (RRULE) engine in [`brandtrack`](https://github.com/SergiCoder/brandtrack), specifically:

- [`packages/brandtrack_core/lib/rrule/rrule_current_time_validation.dart`](https://github.com/SergiCoder/brandtrack/blob/main/packages/brandtrack_core/lib/rrule/rrule_current_time_validation.dart) — `RruleCurrentTimeValidation` extension on `RRule`: given a `currentTime`, decides whether the rule applies right now.
- [`packages/brandtrack_core/lib/rrule/datetime_extension.dart`](https://github.com/SergiCoder/brandtrack/blob/main/packages/brandtrack_core/lib/rrule/datetime_extension.dart) — `DateTimeExtension` on `DateTime`: helpers for `yearDay`, `beginningOfDay`, `beginningOfNextDay`. Foundation for the RRULE generator.

## 2.2 Context

`brandtrack` is a Flutter/Dart project that schedules and plays branded radio content. Each radio carries an [iCalendar RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.10) **RRULE** describing *when* it should be live (e.g., `FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=9,12,15`). The runtime needs to answer one question every tick: *given current local time, is this radio scheduled now?*

There are RRULE libraries on pub.dev, but the ones I tried either didn't expose enough of the spec, didn't fit Flutter's null-safety constraints cleanly, or had unfixed bugs around DST and `BYHOUR`/`BYMINUTE` interactions. So I wrote a slim, focused version: just enough of RFC 5545 to support the rule shapes our content schedulers actually emit.

## 2.3 What it does

- **`RruleCurrentTimeValidation.isValidCurrentTime(currentTime)`** — composes a stack of cheap filters first (start window, until window, weekday match), then falls back to generating today's occurrence list and bucketing `currentTime` into the rule's frequency precision (hourly → top-of-hour, minutely → top-of-minute, etc.). The bucketing avoids the "the schedule said 12:00:00 but the tick fired at 12:00:01" class of off-by-microsecond bugs.
- **`DateTimeExtension`** — `yearDay`, `beginningOfDay`, `beginningOfNextDay`. Small, but they're the primitives every other rule check builds on, so getting them right matters more than the lines suggest.
- **`DateTimeListExtension.adjustDatesInFrequency`** — maps the list of today's local fire times onto the rule's precision bucket, so the `contains` check at the top of validation is symmetric across both sides.

## 2.4 Why I'm proud of it

- It's the *opposite* of feature-creep: it implements only the slice of RFC 5545 we ship today, with extension hooks for the rest. Each branch (`byHour`, `byMinute`, `byWeekDay`, etc.) is a separate guard in `_dateMatchesCriteria`, not a god-method.
- The validator pattern (cheap rejections first, expensive generation last) keeps the hot path fast.
- Frequency-bucketing makes equality testing robust without compromising on precision when the rule asks for it.
- It replaced a tangled mess of `if (now.hour == ... && now.minute == ...)` checks scattered through three callers with one `rrule.isValidCurrentTime(now)` call.

## 2.5 Self-review — observations from re-reading the code while writing this README

In the spirit of "show me how you think", here are three things I'd want to verify or fix on a follow-up pass. I have not pushed any changes to `brandtrack` from this session because I do not have Dart/Flutter installed on this machine and would not change scheduling logic without running its test suite.

1. **Typo: `begninningOfNextDay`** — the getter in `datetime_extension.dart` has an extra `n` before `i`. Also used at `rrule_generator_extension.dart` line 12. Pure rename + propagation; no behavioural change. Low-risk fix once test runner is available.
2. **Suspected logical inversion in `isValidCurrentTime`** — the final clause reads:
   ```dart
   if (!localTimeDatesAdjustedInFrequency.contains(adjustedCurrentTime)) {
     return true;     // returns "valid" when current bucket is NOT a scheduled time
   }
   return false;
   ```
   Reading the caller at `packages/features/lib/player/domain/utils/radio_extensions.dart` (`if (!isValidCurrentTime) continue;` — skip radio when "not valid"), and the daily-`byWeekDay` branch immediately above (returns `true` when the weekday matches a schedule), the natural reading is that `true` should mean *"this rule fires now"*. Under that reading the final clause should be `if (contains) return true; return false;`. Worth pinning with a unit test asserting `isValidCurrentTime(scheduledFireMoment) == true` before flipping — but I'd flag it for review.
3. **DST edge case in `yearDay`** — `this.difference(DateTime(year)).inDays + 1` uses duration arithmetic against a local-time anchor. With a DST transition between Jan 1 and `this`, `inDays` truncates and the result can be off by one for dates near year-end. Switching both anchors to `DateTime.utc(...)` sidesteps it without changing the public contract.

These are exactly the kind of findings I'd raise on a PR review of someone else's code, so I want them on the record for mine too.

---

# Question 3 — Preferred processes, methodologies, tools

This section is intentionally a scaffold — each bullet is a one-line prompt for what I'd say in person. I can expand any of these into a full paragraph on request.

## 3.1 Building a product from scratch

### Discovery & framing
- One-pager before any code: who is this for, what does success look like in 30 days, what's the smallest thing that could be wrong about the premise.
- Spike-then-throw-away to de-risk the riskiest unknown (a third-party API, a perf assumption, an integration) before committing to architecture.

### Architecture & code shape
- Hexagonal-lite as default — domain in pure modules, adapters at the edges. Same approach as this repo's `lib/` vs `components/` + `scripts/`.
- Frozen stack documented in a project `CLAUDE.md`: language, runtime, lint, test, format, package manager, validation library — one of each. Deviations require justification in the README.
- Strict TypeScript (or strong typing in whatever language) with explicit return types on exports, Zod (or equivalent) as the only validation library, `z.infer` as the only DTO source. No parallel hand-typed entities.

### Tests
- Co-located `*.spec.ts` or a single `tests/` tree — pick one and stick to it.
- 100% coverage gate enforced in CI from day one (see `vitest.config.mts` here). Easier to keep than to add back.
- Integration-style tests at the boundary (`app.inject` for Fastify, RTL + jsdom for React). Mock only out-of-process I/O — never the validator, never the database client.

### Process & cadence
- Conventional Commits, one logical purpose per commit. Squash-or-rebase merges only.
- `prism:ship` (my commit + verify + push tool) at every checkpoint — typecheck + lint + tests run *before* each commit, not just in CI.
- `prism:review-and-fix` run once before each merge: multi-profile review (TypeScript / Next.js / React / security / performance / quality / testing / documentation) that fixes findings directly, then I diff-review and accept selectively.
- AI used aggressively for boilerplate and scaffolding; rejected for anything that would invalidate type safety, error handling, or test invariants.

### Tooling defaults
- Package manager: pnpm.
- Lint + format: Biome (one tool, no ESLint/Prettier zoo).
- Tests: Vitest (with v8 coverage); for backend, add Vitest + `app.inject` integration.
- Framework default: Next.js 15+ for fullstack web; Fastify 5 + Drizzle + Postgres for headless services.
- CI: GitHub Actions, single workflow, the same `pnpm typecheck && pnpm lint && pnpm test:coverage` you run locally — no divergence.
- Observability from day one: structured logging (Pino for Fastify), one dashboard, request IDs, error alerting on a dedicated channel.

## 3.2 Applying the same to an existing product

Most of the above transfers, but the *approach* changes — you cannot rebuild from scratch, so you fold improvements in incrementally.

### What still applies (verbatim)
- Frozen stack documented in `CLAUDE.md` — capture what *is*, not what you wish were there.
- Conventional Commits + `prism:ship` cadence.
- Multi-profile review on every PR via `prism:review-and-fix`.
- Strict typing where the codebase supports it; opt in file-by-file via `// @ts-strict` or per-file lint overrides if the global flip would be a multi-week stop-the-line.
- Integration tests at the boundary, never mock the validator or DB client.

### What changes
- **Characterisation tests first** — before refactoring, write tests that pin current behaviour (even the weird parts). Then refactor with a safety net.
- **Strangler-fig pattern** — new behaviour goes in the new architecture; old behaviour stays in the old until the new one is proven, then the old is removed. No big-bang rewrites.
- **Coverage gate ratcheted, not flipped** — you can't go from 23% to 100% in a sprint, but you can set the gate to *"coverage cannot decrease from the current baseline"*. Then nudge it up on every PR that touches the area.
- **Additive migrations only** — schema changes are deploy-then-backfill-then-cleanup, never "drop column in same release as code that stops using it". Each step deploys independently and is rollback-safe.
- **Feature flags** (GrowthBook, LaunchDarkly, or a small internal one) for any change with a non-obvious blast radius. Default-off for new flags; remove flags within a sprint of full rollout — flags rot fast.
- **One legacy hotspot at a time** — pick the single highest-traffic, highest-incident file each quarter and dedicate refactor time to it. Don't fan out.

---

# Repository hygiene

- `CLAUDE.md` codifies project rules (stack, layout, TS discipline, Zod, 100% coverage, anti-patterns).
- No `Co-Authored-By: Claude` trailers in any commit (see `CLAUDE.md` §2).
- The first vanilla-JS pass is preserved in git history (commits before `13dc2d4`) for reference; the current `main` is the Next.js refactor.
