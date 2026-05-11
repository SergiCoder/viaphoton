# viaPhoton — Sergi Coderch's submission

This repository is my full submission for the viaPhoton exercise. It answers **all three questions** from the brief:

1. **The Jeep / Desert-Crossing nut transport problem** — implemented end-to-end in this repo, with a Next.js web UI, a Node CLI, and a 100%-covered test suite.
2. **A piece of code I'm proud of** — an RFC 5545 RRULE engine I built for a Flutter/Dart project, included inline below.
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

## 2.1 Context

A small RFC 5545 **RRULE** engine I wrote for a Flutter/Dart project that schedules and plays recurring content. Each scheduled item carries an RRULE (e.g., `FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=9,12,15`); on every tick the runtime needs to answer *"does this rule apply right now?"*. The libraries on pub.dev I tried were either incomplete, awkward under null-safety, or had bugs around DST and `BYHOUR`/`BYMINUTE` interactions, so I wrote a focused slice of the spec.

## 2.2 The two classes

A standalone DartPad-runnable version with a 22-assertion test suite lives at [`scratch/rrule_dartpad.dart`](scratch/rrule_dartpad.dart) — paste into [dartpad.dev](https://dartpad.dev) and press Run.

```dart
/// Extension for RRule to validate the current time.
extension RruleCurrentTimeValidation on RRule {
  /// Returns true if [currentTime] falls within an active occurrence of this
  /// rule. Cheap rejections first (start/until window, today's local-time
  /// window), then bucket [currentTime] into the rule's frequency precision
  /// and match it against today's scheduled fire times.
  ///
  /// Per RFC 5545, DTSTART and UNTIL are both inclusive — `currentTime ==
  /// start` or `currentTime == until` count as valid occurrences.
  bool isValidCurrentTime(DateTime currentTime) {
    if (start != null && currentTime.isBefore(start!)) return false;
    if (until != null && currentTime.isAfter(until!)) return false;

    final todayLocalTimes = generateTodayLocalTimes(now: currentTime);
    if (todayLocalTimes.isEmpty) return false;
    if (todayLocalTimes.first.isAfter(currentTime)) return false;
    if (todayLocalTimes.last.isBefore(currentTime)) return false;

    final adjusted = todayLocalTimes.adjustDatesInFrequency(
      frequency: frequency,
      todayLocalTimes: todayLocalTimes,
    );
    return adjusted.contains(currentTime.adjustedDateInFrequency(frequency));
  }
}
```

```dart
/// Extension on DateTime: day-of-year and day-boundary helpers.
extension DateTimeExtension on DateTime {
  /// Day of the year (1..366). UTC anchors sidestep DST truncation.
  int get yearDay {
    final firstDayUtc = DateTime.utc(year, 1, 1);
    final thisDayUtc = DateTime.utc(year, month, day);
    return thisDayUtc.difference(firstDayUtc).inDays + 1;
  }

  /// Local midnight at the start of [this] day.
  DateTime get beginningOfDay => DateTime(year, month, day);

  /// Local midnight at the start of the day after [this]. Calendar
  /// arithmetic (`day + 1`) instead of `Duration(days: 1)` keeps the result
  /// at midnight across DST transitions.
  DateTime get beginningOfNextDay => DateTime(year, month, day + 1);
}
```

## 2.3 Why I'm proud

- **Cheap rejections first, expensive generation last** — the validator short-circuits on `start`/`until` and on today's window before generating the full occurrence list.
- **Frequency bucketing** rounds both sides to the rule's precision, so `isValidCurrentTime` works robustly when ticks land off the exact scheduled microsecond.
- It replaced a sprawl of `if (now.hour == X && now.minute == Y)` across three callers with one `rrule.isValidCurrentTime(now)` call.



---

# Question 3 — Preferred processes, methodologies, tools

## 3.1 Building a product from scratch

### Methodology: spec-driven development

For greenfield work I go with **spec-driven development**. Before any code, I want a written spec — the problem, the constraints, the acceptance criteria, the edge cases. It forces the ambiguity out early, when it's cheap to resolve. A vague spec turns into rework; a sharp spec turns into shippable code. This repo is itself an example: the brief was the spec, and the test suite (including the canonical `10,100,1,10 → ≈13.998` anchor) is its executable form.

### Tooling: AI-assisted, review-gated

My default loop right now is **Claude Code with Opus 4.7**, paired with my own **Prism plugin** for structured review on every diff (TypeScript / Next.js / React / security / performance / quality / testing / documentation). The plugin enforces a consistent bar before code merges, so one person operates closer to the throughput of a small team without dropping review discipline.

Tooling has to respect context, though. If the project involves **sensitive IP**, regulated data, or a client that doesn't allow third-party model providers, I won't force Claude Code into it. In that case I'd switch to an **open-source agent like opencode running against local LLMs** — slower and less capable today, but the code never leaves the environment. The methodology stays the same; only the engine changes.

### Stack and architecture: requirements-led, reliability-first

I have a strong opinion about *not* having strong opinions on stack up front. I start from the **requirements** — load profile, latency budget, team skills, compliance constraints, time-to-market — and let those decide. Preferences and trends don't matter. **Reliability does.** I'd rather pick a boring, well-understood stack I can reason about under failure than the most exciting one on Hacker News this month.

For this submission the requirements pointed at a fullstack web stack with strict types and excellent ergonomics, so:

- Next.js 16 (App Router) + React 19 + TypeScript 6 strict
- Zod 4 as the sole validation library, `z.infer` as the only DTO source
- Vitest 4 + 100% coverage gate enforced in CI from day one
- Biome 2 for lint+format (one tool, no ESLint/Prettier zoo)
- pnpm as package manager
- Hexagonal-lite layout — `lib/` pure, `components/` + `scripts/` as adapters

Different requirements would lead to a different stack. For a headless service I'd reach for Fastify 5 + Drizzle + Postgres; for a mobile target I've shipped Flutter/Dart before (see Question 2 for an example).

### Process & cadence

- Conventional Commits, one logical purpose per commit. 
- `prism:ship` at every checkpoint — typecheck + lint + tests run **before** each commit, not just in CI.
- `prism:review-and-fix` once before each merge: multi-profile review that fixes findings directly, then I diff-review and accept selectively.
- CI is the same `pnpm typecheck && pnpm lint && pnpm test:coverage` you run locally — no divergence.
- Observability from day one: structured logging, request IDs, one dashboard, error alerting on a dedicated channel.

## 3.2 Applying the same to an existing product

The spec-driven mindset and the AI-assisted workflow still apply — if anything they apply **more** on a live product, because changes have to coexist with existing behaviour, existing data, and existing users. But the constraints shift, and the discipline tightens as the cost of mistakes goes up.

### What still applies

- Frozen stack documented in `CLAUDE.md` — capture what *is*, not what you wish were there.
- Conventional Commits + `prism:ship` cadence.
- Multi-profile review on every PR via `prism:review-and-fix`.
- Strict typing where the codebase supports it; opt in file-by-file via per-file overrides if the global flip would be a multi-week stop-the-line.
- Integration tests at the boundary, never mock the validator or the DB client.

### What changes

- **Characterisation tests first** — before refactoring, write tests that pin current behaviour (even the weird parts). Then refactor with a safety net.
- **Strangler-fig pattern** — new behaviour goes in the new architecture; old behaviour stays in the old until the new is proven, then the old is removed. No big-bang rewrites.
- **Coverage gate ratcheted, not flipped** — you can't go from 23% to 100% in a sprint, but you can set the gate to *"coverage cannot decrease from the current baseline"* and nudge it up on every touched area.
- **Data-driven decisions dominate.** Product analytics (Amplitude / Mixpanel / PostHog), A/B tests, cohort analysis. You finally have real users — let them tell you what to build.
- **Risk management matters more**: feature flags (GrowthBook, LaunchDarkly, or a small internal one) for any change with non-obvious blast radius. Default-off, removed within a sprint of full rollout — flags rot fast.
- **Additive migrations only** — deploy-then-backfill-then-cleanup, never "drop column in same release as code that stops using it". Each step deploys independently and is rollback-safe.
- **One legacy hotspot at a time** — highest-traffic, highest-incident file each quarter, dedicated refactor time. Don't fan out.
- **Processes get slightly heavier on purpose**: incident response, on-call, RFC-style design docs for anything non-trivial.

**The short version**: from scratch is about reducing uncertainty fast. Evolving is about reducing risk while still moving forward. Same principles — spec-driven, requirements-led, reliability-first — but the discipline tightens as the cost of mistakes goes up.

---

# Repository hygiene

- The first vanilla-JS pass is preserved in git history (commits before `13dc2d4`) for reference; the current `main` is the Next.js refactor.
