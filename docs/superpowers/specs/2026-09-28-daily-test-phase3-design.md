# Daily Test — Phase 3 Design

Date: 2026-09-28
Status: Approved
Scope: Phase 3 of 4 (see Phase 1 spec for the overall roadmap:
`docs/superpowers/specs/2026-09-27-vocabulary-flashcards-phase1-design.md`)

## Goals

- Let the child take a short (up to 20-question) multiple-choice check-up
  at any time, drawn from every word they've ever encountered (both
  "known" and "still learning"), to measure retention over time.
- Keep the progress store honest: a word answered incorrectly moves back
  to "learning" (even if it was previously "known"), so it resurfaces in
  Phase 1 flashcard sessions; a word answered correctly is (re)marked
  "known".
- Log every attempt (unlimited retakes per day) to a history list in
  `localStorage`, which Phase 4's dashboard will read to chart progress
  over time. This is the one place Phase 3 diverges from Phase 2's
  storage model, which only keeps the latest result.

## Non-goals

- No daily cadence enforcement (no "once per day" lock, no streak
  tracking) — the child can retake anytime.
- No topic recommendation banner on the results screen — that's
  Placement Test's job (Phase 2); duplicating it here would be
  confusing about which feature "owns" the recommendation.
- No dashboard/analytics UI — Phase 3 only produces the history data;
  Phase 4 renders it.
- No new question-generation or scoring logic beyond what Phase 2
  already built — Phase 3 reuses `buildChoices` and `computeTopicStats`
  from `src/lib/placementTest.ts` and `PlacementQuestionCard` from
  Phase 2 as-is (not renamed), since both are already fully generic.

## Users & usage context

Same as Phases 1–2: a single child (age 6), no login, local-only.

## Tech stack

Same as Phases 1–2 (Vite + React + TypeScript + Tailwind + React Router +
Web Speech API + Vitest/RTL). No new dependencies.

## Data model

### Question generation (`src/lib/dailyTest.ts`, new file)

```ts
export function selectDailyTestWords(
  seenWordIds: string[],
  count: number,
  random: () => number = Math.random
): VocabWord[];

export function generateDailyTest(
  seenWordIds: string[],
  count = 20,
  random: () => number = Math.random
): PlacementQuestion[];
```

- `selectDailyTestWords` resolves `seenWordIds` to `VocabWord`s (via
  `getWordById` from `src/data/vocabulary.ts`, dropping any that fail to
  resolve — defensive, shouldn't happen since ids always come from our
  own progress store), shuffles them, and takes up to `count`. Unlike
  Phase 2's `selectPlacementWords`, there's no round-robin-across-topics
  requirement here — a plain shuffle-and-slice is enough, since the goal
  is "sample from what's been learned," not "cover every topic."
- `generateDailyTest` calls `selectDailyTestWords`, then reuses
  `buildChoices` (imported from `./placementTest`) per word to build each
  `PlacementQuestion`, then shuffles the final question order. Reuses the
  exact `PlacementQuestion` type from Phase 2 — no new question type
  needed.

### Storage (`src/lib/dailyTestStorage.ts`, new file)

- `localStorage` key: `vocab-daily-test-history`.
- Stores an **array** of `PlacementResult` (the type is reused as-is from
  Phase 2 — `{ completedAt, totalQuestions, correctCount, topicStats }`;
  no new type needed since the shape is identical).
- `saveDailyTestResult(result: PlacementResult): void` — reads the
  existing array (defaulting to `[]`), appends `result`, writes it back.
  Wrapped in try/catch like `progress.ts` and `placementStorage.ts`;
  silently no-ops if storage is unavailable.
- `getDailyTestHistory(): PlacementResult[]` — reads and parses the
  array; returns `[]` if missing or corrupted.
- No cap on history length for this phase (a single child doing at most
  a few check-ups a day won't produce enough entries to matter; revisit
  if that assumption changes).

### Progress updates

No new library code — `src/pages/DailyQuiz.tsx` calls the existing
`recordProgress(wordId, status)` from `src/lib/progress.ts` directly:
`status` is `"known"` for a correct answer, `"learning"` for a wrong one.
This is the same call Phase 2 makes for correct answers, extended here to
also fire (with `"learning"`) on wrong ones — which is what causes a
previously-"known" word to move back into the flashcard rotation.

## Screens & flow

Routes (added to `src/App.tsx`):

- `/daily-test` — **Intro screen** (`src/pages/DailyTestIntro.tsx`, new).
  Reads `getAllProgress()` from `src/lib/progress.ts`:
  - No words recorded yet: shows an encouraging empty-state message
    ("Learn some words first!") with a link back to Home — no Start
    button, since there's nothing to test yet.
  - Otherwise: short explanation ("Quick daily check-up! Let's see what
    you remember.") and a "Start Test" button that generates the
    question set (`generateDailyTest(Object.keys(progress))`) and
    navigates to the quiz with it via router `state` — same
    state-handoff pattern Phase 2's `PlacementIntro` uses.
- `/daily-test/quiz` — **Quiz screen** (`src/pages/DailyQuiz.tsx`, new).
  Structurally a near-copy of Phase 2's `PlacementQuiz`: renders the
  current `PlacementQuestion` via `PlacementQuestionCard`, tracks
  `currentIndex`/`answers` in local state, shows a `ProgressBar`. The one
  behavioral difference: `handleNext` calls `recordProgress` for *every*
  answer (both correct and incorrect), not just correct ones. On the
  last question: computes `topicStats` via `computeTopicStats` (reused
  from `placementTest.ts`), builds a `PlacementResult`, calls
  `saveDailyTestResult`, and navigates to
  `/daily-test/results` with the result in `state`. Redirects to
  `/daily-test` if loaded without a question list in `state`.
- `/daily-test/results` — **Results screen** (`src/pages/DailyResults.tsx`,
  new). Shows the score ("14 / 20 correct! 🎉") and a short encouraging
  message, plus a "Back to Word Explorer" link to Home. Redirects to
  `/daily-test` if loaded without a result in `state` (same defensive
  pattern as Phase 1/2's results-style screens).

## Changes to Home (`src/pages/Home.tsx`)

- Adds a second, separate banner/button below the existing Placement Test
  banner: "Daily Check-up 🎯" linking to `/daily-test`. Always shown
  (not conditional on progress existing) — the Intro screen itself
  handles the "nothing learned yet" case, keeping Home's logic simple.
- No changes to the topic grid or the existing Placement Test banner.

## Visual design

Consistent with Phases 1–2: same palette, rounded shapes, Baloo 2 font,
bounce/scale interactions. `DailyQuiz` reuses `PlacementQuestionCard` and
`ProgressBar` visually as-is — no new visual components beyond the three
new pages, which follow the same centered-card layout as Phase 2's
Intro/Results screens.

## Error handling

- Same Web Speech API and `localStorage` degradation rules as Phases 1–2,
  inherited for free by reusing `PlacementQuestionCard` and following
  `progress.ts`'s try/catch pattern in `dailyTestStorage.ts`.
- Loading `/daily-test/quiz` or `/daily-test/results` directly (no
  `state`) redirects to `/daily-test`.
- Zero previously-seen words: handled explicitly by the Intro screen's
  empty state (see above) rather than allowing a 0-question quiz to be
  generated.

## Testing approach

- Unit tests for `dailyTest.ts` (`selectDailyTestWords`,
  `generateDailyTest`) using an injected deterministic `random` function,
  following the same pattern as `placementTest.test.ts` — assert
  structural invariants (returns at most `count` words, never more than
  the seen-word pool, each question has 4 choices containing the
  answer).
- Unit tests for `dailyTestStorage.ts` mirroring `placementStorage.test.ts`,
  adjusted for array-append-not-overwrite semantics (confirm multiple
  saves accumulate rather than replace).
- Component/page tests for `DailyTestIntro` (empty state vs. normal
  state), `DailyQuiz` (records "known" for correct / "learning" for
  incorrect answers, including a word that was previously "known" being
  downgraded; saves history and navigates to results after the last
  question; redirects without state), and `DailyResults` (shows score;
  redirects without state) — following the same patterns as Phase 2's
  `PlacementIntro`/`PlacementQuiz`/`PlacementResults` tests.
- Manual browser check for the full flow, same as prior phases' final
  task.

## Open questions / future considerations (not blocking Phase 3)

- Phase 4's dashboard will read `getDailyTestHistory()` directly; no
  aggregation/summarization is built in this phase.
- If history grows unbounded over months of daily use, a future phase
  may want to cap or prune it — not a concern at the data volumes a
  single child's local use will produce.
