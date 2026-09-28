# Progress Dashboard — Phase 4 Design

Date: 2026-09-28
Status: Approved
Scope: Phase 4 of 4 (final phase — see Phase 1 spec for the overall
roadmap: `docs/superpowers/specs/2026-09-27-vocabulary-flashcards-phase1-design.md`)

## Goals

- Give the parent a single screen summarizing the child's vocabulary
  progress: how many words are known overall, how that breaks down by
  topic, and how Daily Check-up scores have trended over recent attempts.
- Build entirely on data already being recorded by Phases 1–3
  (`progress.ts`'s per-word status, `dailyTestStorage.ts`'s history) — no
  new tracking or data collection is introduced in this phase.

## Non-goals

- No new data collection — this phase only reads and aggregates existing
  `localStorage` data.
- No interactivity on the score trend chart (no hover/tooltip, no
  filters/date-range controls) — static display only, per explicit
  choice.
- No dark mode, no CVD-texture fallback, no table-view fallback for the
  chart — the app is light-mode-only throughout Phases 1–3, and a single
  static single-series line chart doesn't carry the accessibility
  obligations a multi-series or interactive chart would.
- No pagination/filtering of the score trend — it simply shows the most
  recent 14 Daily Check-up attempts.
- No new charting dependency — the trend chart is hand-drawn SVG,
  consistent with this project's zero-extra-dependency pattern so far.

## Users & usage context

Primary audience is the parent (not the child) — reviewed occasionally,
not part of the child's daily flow. Same local-only, single-child,
no-login context as Phases 1–3.

## Chart design decisions (per the dataviz method)

- **Overall known/total**: a job of "the one number a dashboard leads
  with" → a **stat tile**, not a chart (a one-bar bar chart would be the
  anti-pattern here).
- **Per-topic breakdown**: a job of "compare magnitude across categories"
  → **bar form, sequential (one hue)** color, not one color per topic.
  This reuses the existing single-hue `ProgressBar` component from Phase
  1 as-is (one row per topic) rather than introducing a new
  per-topic-colored bar — simpler and more correct per the method (a
  magnitude comparison shouldn't carry 13 different hues; the topic name
  label already identifies each row).
- **Score trend over time**: a job of "trend over time, single series" →
  **line**, single hue (sky-500, distinct from the emerald "known/correct"
  hue used elsewhere so the two metrics are never visually conflated), no
  legend needed (title names the single series), sparse direct label
  (only the most recent point's value), recessive hairline gridlines at
  0/50/100.
- Mark specs applied: 2px line with round join/cap, ≥8px end markers,
  2px surface-color ring on markers, 1px solid recessive gridlines — the
  core marks-and-anatomy specs, scoped down from the full method (no
  hover layer, no texture, no dark-mode variant — see Non-goals).

## Data model

### Aggregation (`src/lib/dashboardStats.ts`, new file)

Pure functions, no rendering — reads from existing lib modules only:

```ts
export interface TopicBreakdown {
  topicId: string;
  topicName: string;
  topicEmoji: string;
  knownCount: number;
  totalCount: number;
}

export interface ScoreTrendPoint {
  completedAt: number;
  percentage: number; // 0-100, rounded
}

export function getOverallStats(): { knownCount: number; totalWords: number };

export function getTopicBreakdown(): TopicBreakdown[];

export function getScoreTrend(limit = 14): ScoreTrendPoint[];
```

- `getOverallStats`: reads `getAllProgress()` from `src/lib/progress.ts`,
  counts entries with `status === "known"`; `totalWords` is
  `words.length` from `src/data/vocabulary.ts` (the fixed ~145-word
  catalog).
- `getTopicBreakdown`: for each `Topic` in `topics` (canonical order from
  `src/data/vocabulary.ts`), counts how many of `getWordsForTopic(topicId)`
  have `status === "known"` in the progress store, alongside that
  topic's total word count. Returns one entry per topic, always 13
  entries, in canonical order (topics with zero known words still
  appear, at 0%).
- `getScoreTrend`: reads `getDailyTestHistory()` from
  `src/lib/dailyTestStorage.ts`, maps each `PlacementResult` to
  `{ completedAt, percentage: Math.round(correctCount / totalQuestions * 100) }`,
  sorts ascending by `completedAt` (defensive — history is already
  append-ordered), and returns the last `limit` entries so the chart
  never has to render an unbounded series.

No new `localStorage` keys, no writes — this module is read-only.

## Screens & flow

### Route (added to `src/App.tsx`)

- `/dashboard` — **Dashboard page** (`src/pages/Dashboard.tsx`, new).
  No sub-routes, no router `state` handoff needed (unlike Phases 2–3)
  since this page only reads existing storage on render — there's no
  multi-step flow to carry state through.

### Page layout

1. Heading: "Progress Report 📊".
2. **Stat tile**: large number "`<knownCount>` / `<totalWords>` words
   learned" in a white rounded-3xl card, consistent with the card style
   `Flashcard`/`PlacementQuestionCard` already establish.
3. **Per-topic breakdown**: a list of 13 rows, each showing the topic's
   emoji + name, a `ProgressBar` (reused as-is from
   `src/components/ProgressBar.tsx`, `current=knownCount`,
   `total=totalCount`), and a "`x`/`y`" text label.
4. **Score trend**: heading "Daily Check-up Progress", then either:
   - `ScoreTrendChart` (new component, see below) if
     `getScoreTrend()` is non-empty, or
   - An empty-state message: "Take the Daily Check-up to start tracking
     your progress!" with a link to `/daily-test`, if no Daily Check-up
     has ever been completed.
5. A "Back to Word Explorer" link to Home.

### `ScoreTrendChart` component (`src/components/ScoreTrendChart.tsx`, new)

- Props: `data: ScoreTrendPoint[]` (assumed non-empty — the empty case is
  handled by the page, not this component, keeping the component's
  contract simple: "given points, draw them").
- Renders a single hand-drawn SVG:
  - X-axis: sequential attempt index (oldest → newest, left → right) —
    not calendar dates, since multiple attempts can land on the same day
    and a plain sequence reads cleanly without needing date-axis
    formatting logic.
  - Y-axis: fixed 0–100% scale with three recessive hairline gridlines
    at 0/50/100.
  - A single 2px sky-500 polyline connecting the points, each point
    marked with a ≥8px filled circle with a 2px white ring.
  - The most recent (rightmost) point gets a direct text label showing
    its percentage — the only labeled point, per the method's "label
    sparingly" rule.
  - If `data.length === 1`: renders just the single marker (no line
    segment possible with one point).

## Changes to Home (`src/pages/Home.tsx`)

- Adds a third banner/button, below the existing Placement Test and
  Daily Check-up banners: "Progress Report 📊" linking to `/dashboard`.
  Always shown, no conditional logic — consistent with the Daily
  Check-up banner's treatment in Phase 3.

## Visual design

Consistent with Phases 1–3: same palette, rounded shapes, Baloo 2 font.
The stat tile and per-topic list use the same white-card/rounded-3xl
language as existing pages. The new sky-500 hue for the trend line is
already part of the app's existing palette (used for the 🔊 Listen
button throughout) — no new color is introduced to the app.

## Error handling

- No words learned yet: stat tile correctly shows "0 / 145 words
  learned"; per-topic bars all show 0% — no special-casing needed, the
  existing `ProgressBar` component already handles a 0/0 or 0/N ratio.
- No Daily Check-up history: handled by the page-level empty state
  described above (not inside `ScoreTrendChart`).
- This phase performs no new `localStorage` writes, so it inherits no
  new failure modes beyond what Phases 1–3's read helpers already handle
  defensively (corrupted JSON → treated as empty/default).

## Testing approach

- Unit tests for `dashboardStats.ts` (`getOverallStats`,
  `getTopicBreakdown`, `getScoreTrend`) using real `localStorage` in
  jsdom via the existing `recordProgress`/`saveDailyTestResult` helpers
  to seed state, then asserting the computed aggregates — same pattern
  as `placementTest.test.ts`'s scoring tests.
- Component tests for `ScoreTrendChart`: renders the correct number of
  markers for a given `data` array; renders only the last point's
  percentage as a text label; renders a single marker with no line for
  one-point data.
- Page tests for `Dashboard`: shows the correct overall count; shows all
  13 topic rows with correct fractions; shows the chart when history
  exists; shows the empty-state message and a link to `/daily-test` when
  it doesn't; has a link back to Home — following the same
  real-`localStorage`-seeding pattern `Home.test.tsx` already uses (no
  mocking needed, since this page has no side effects to isolate).
- `Home.test.tsx`: one more test confirming the "Progress Report" link
  is always present.
- `App.test.tsx`: one more test confirming `/dashboard` renders the
  Dashboard page.
- Manual browser check: seed some known words and a couple of Daily
  Check-up attempts, view the dashboard, confirm the stat tile, topic
  bars, and trend chart all read correctly; confirm the empty states
  look right before any data exists.

## Open questions / future considerations (not blocking Phase 4)

- If the parent wants historical trends beyond the last 14 attempts, a
  future iteration could add a "view all" or date-range control — out of
  scope per the "no interactivity" decision for this phase.
- This is the last of the four planned phases; no further phases are
  currently planned beyond this spec.
