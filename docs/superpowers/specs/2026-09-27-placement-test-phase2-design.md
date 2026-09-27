# Placement Test — Phase 2 Design

Date: 2026-09-27
Status: Approved
Scope: Phase 2 of 4 (see Phase 1 spec for the overall roadmap:
`docs/superpowers/specs/2026-09-27-vocabulary-flashcards-phase1-design.md`)

## Goals

- Let the child take a multiple-choice vocabulary test at any time (from
  Home, not automatically), to get a quick read on which words they
  already know.
- Reuse the result to seed progress: any word answered correctly is marked
  "known" in the existing Phase 1 progress store, so it's skipped as new
  material during flashcard sessions.
- Surface one lightweight recommendation on Home — the single topic the
  child scored lowest on — without reordering or otherwise disrupting the
  existing topic grid.

## Non-goals

- No formal proficiency levels (Beginner/Intermediate/Advanced) and no
  locking/gating of topics by level. Phase 1's "browse any topic freely"
  model is unchanged.
- No reordering of the Home topic grid. Stability matters more than
  optimal ordering for a 6-year-old.
- No adaptive test (question difficulty doesn't change based on prior
  answers within the same test run).
- No test history / trend over multiple placement-test attempts — only
  the most recent run's stats are kept (overwritten on retake).

## Users & usage context

Same as Phase 1: a single child (age 6), no login, local-only, likely on
a tablet or phone.

## Tech stack

Same as Phase 1 (Vite + React + TypeScript + Tailwind + React Router +
Web Speech API + Vitest/RTL). No new libraries.

## Data model

### New types (added to `src/types.ts`)

```ts
export interface PlacementQuestion {
  word: VocabWord;
  choices: VocabWord[]; // length 4, includes `word`, order randomized
}

export interface PlacementAnswer {
  wordId: string;
  topicId: string;
  correct: boolean;
}

export interface TopicStat {
  correct: number;
  total: number;
}

export type TopicStats = Record<string /* topicId */, TopicStat>;

export interface PlacementResult {
  completedAt: number; // epoch ms
  totalQuestions: number;
  correctCount: number;
  topicStats: TopicStats;
}
```

### Question generation (`src/lib/placementTest.ts`)

- `selectPlacementWords(count: number, random: () => number = Math.random): VocabWord[]`
  — picks `count` words spread across all topics using round-robin
  sampling: shuffle the topic list, take one not-yet-picked word from each
  topic in turn, repeat until `count` words are selected or every topic is
  exhausted. With 13 topics and `count = 30`, this yields 2 words from
  every topic plus 1 extra word from 4 randomly-chosen topics — every
  topic contributes at least once.
- `buildChoices(word: VocabWord, random: () => number = Math.random): VocabWord[]`
  — returns 4 `VocabWord`s: `word` plus 3 other words from the same
  `topicId` (chosen without replacement), shuffled together. Safe for
  every topic in the current data set because every topic has ≥ 8 words
  (minimum needed is 4).
- `generatePlacementTest(count = 30, random: () => number = Math.random): PlacementQuestion[]`
  — combines the two above, then shuffles the resulting question order
  (so questions aren't grouped by topic).
- All three take an injectable `random` source so tests can pass a
  deterministic function instead of `Math.random`.

### Scoring (`src/lib/placementTest.ts`)

- `computeTopicStats(answers: PlacementAnswer[]): TopicStats` — tallies
  `{ correct, total }` per `topicId` from a flat list of answers.
- `findWeakestTopicId(stats: TopicStats): string | undefined` — returns
  the topicId with the lowest `correct / total` ratio; ties broken by the
  topic's position in the canonical `topics` array (`src/data/vocabulary.ts`)
  for determinism. Returns `undefined` for an empty `stats` object.

### Storage (`src/lib/placementStorage.ts`)

- `localStorage` key: `vocab-placement`.
- `savePlacementResult(result: PlacementResult): void` — overwrites any
  previous result (wrapped in try/catch like `progress.ts`, silently
  no-ops if storage is unavailable).
- `getPlacementResult(): PlacementResult | undefined` — reads and parses
  the stored result; returns `undefined` if missing or corrupted (same
  defensive pattern as `progress.ts`'s `readStore`).
- Correct answers are recorded into the *existing* Phase 1 progress store
  via `recordProgress(wordId, "known")` from `src/lib/progress.ts` — no
  new mechanism for word-level state.

## Screens & flow

Routes (added to `src/App.tsx`):

- `/placement-test` — **Intro screen**. Short explanation ("Listen to the
  word, pick the right picture — 30 questions") and a "Start Test" button
  that navigates to the quiz with a freshly generated
  `PlacementQuestion[]` (generated once, passed via router `state`, same
  pattern Phase 1 uses for session word lists).
- `/placement-test/quiz` — **Quiz screen**. Renders one
  `PlacementQuestion` at a time via a new `PlacementQuestionCard`
  component:
  - Shows the target word (text) and plays its pronunciation
    automatically (reusing `speak`/`isSpeechSupported` from
    `src/lib/speech.ts`), with a replay 🔊 button — same UX as
    `Flashcard`.
  - Shows 4 large emoji buttons (the choices) in a 2x2 grid.
  - On tap: the tapped choice and the correct choice are both visually
    marked (correct = green, wrong tap = red) and all 4 buttons become
    disabled; a "Next" button appears. The child taps "Next" to advance
    (no auto-advance timer, so the child can take their time reading the
    feedback).
  - A `ProgressBar` (reused from Phase 1) shows position in the 30
    questions.
  - Answers accumulate in local component state
    (`PlacementAnswer[]`); after the last question's "Next"/"See
    Results", the component: (1) calls `recordProgress(wordId, "known")`
    for every correct answer, (2) computes `topicStats` via
    `computeTopicStats`, (3) calls `savePlacementResult` with the full
    `PlacementResult`, (4) navigates to `/placement-test/results` with
    the result in router `state`.
- `/placement-test/results` — **Results screen**. Shows the score
  ("22 / 30 correct! 🎉"), a recommendation banner naming the weakest
  topic (via `findWeakestTopicId`) with a link into that topic's
  `TopicScreen`, and a "Continue to Word Explorer" link to Home. If
  loaded without result state (e.g. a raw reload), redirects to
  `/placement-test` (same defensive pattern as Phase 1's `Summary`
  redirecting when its state is missing).

## Changes to Home (`src/pages/Home.tsx`)

- The topic tile grid itself is unchanged — no reordering, no per-tile
  badges.
- A new banner renders between the page title and the grid:
  - No placement result stored yet: "Take the Placement Test 📝" button
    linking to `/placement-test`.
  - Placement result stored: "⭐ Try this next: `<weakest topic name>`"
    text linking to that topic's `TopicScreen`, plus a smaller "Retake
    Placement Test" link back to `/placement-test`.

## Visual design

Consistent with Phase 1: same color palette, rounded shapes, Baloo 2
font, bounce/scale micro-interactions. The quiz's 2x2 answer grid uses
the same big-tap-target sizing as Phase 1's flashcard action buttons.
Green/red feedback colors reuse Tailwind's `emerald`/`rose` families
already established by Phase 1's "known"/error-adjacent styling.

## Error handling

- Same Web Speech API and `localStorage` degradation rules as Phase 1
  (`speech.ts`, `progress.ts`) — reused as-is, no new handling needed.
- `placementStorage.ts` follows `progress.ts`'s exact try/catch and
  corrupted-JSON-returns-undefined pattern.
- Loading `/placement-test/quiz` or `/placement-test/results` directly
  (no `state`, e.g. a hard reload) redirects to `/placement-test` rather
  than showing a blank/broken screen.

## Testing approach

- Unit tests for `placementTest.ts` (`selectPlacementWords`,
  `buildChoices`, `generatePlacementTest`, `computeTopicStats`,
  `findWeakestTopicId`) using an injected deterministic `random` function
  instead of mocking `Math.random` — assert structural invariants (every
  topic represented, exactly 4 unique choices per question including the
  correct word, correct scoring tallies, deterministic tie-breaking).
- Unit tests for `placementStorage.ts` mirroring `progress.test.ts`'s
  approach (real `localStorage` in jsdom, `Storage.prototype.setItem`
  spy for the failure case).
- Component tests for `PlacementQuestionCard` (renders word + 4 choices,
  speaks on mount, marks correct/incorrect on tap, disables buttons after
  answering, "Next" advances) and for the three pages (Intro, Quiz,
  Results), following the same patterns as Phase 1's `Flashcard`/
  `Session`/`Summary` tests.
- Manual browser check for pronunciation and the full quiz flow, same as
  Phase 1's Task 14.

## Open questions / future considerations (not blocking Phase 2)

- Phase 3 (daily test) may want to reuse `PlacementQuestionCard`'s
  multiple-choice UI — if so, extract a shared presentational component
  at that point rather than duplicating.
- No placement-test history is kept; if a future phase wants trend data
  the storage schema will need an array instead of a single latest
  result.
