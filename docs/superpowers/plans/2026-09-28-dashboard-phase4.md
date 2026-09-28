# Progress Dashboard (Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only `/dashboard` page summarizing progress: total words known out of the full catalog, a per-topic breakdown reusing the existing `ProgressBar`, and a static hand-drawn SVG line chart of the last 14 Daily Check-up scores.

**Architecture:** One new pure aggregation module (`dashboardStats.ts`) that reads Phases 1–3's existing storage (`progress.ts`, `dailyTestStorage.ts`) and the static vocabulary catalog; one new presentational chart component (`ScoreTrendChart`); one new page (`Dashboard`) that composes them. No new `localStorage` writes, no new routes beyond `/dashboard` itself (no sub-flow, unlike Phases 2–3). Home gets a third banner.

**Tech Stack:** Same as Phases 1–3 — Vite, React 18, TypeScript, React Router v6, Tailwind CSS v3, Vitest + React Testing Library. No new dependencies (chart is hand-drawn SVG).

**Spec:** `docs/superpowers/specs/2026-09-28-dashboard-phase4-design.md`

**Builds on:** Phases 1–3, now merged into `main` — this plan assumes
`src/data/vocabulary.ts`, `src/lib/progress.ts`, `src/lib/dailyTestStorage.ts`,
`src/components/ProgressBar.tsx`, `src/pages/Home.tsx`, and `src/App.tsx`
already exist as Phase 3 left them.

---

## File structure (new/changed files after this plan)

```
src/
├── App.tsx                          (modify: add /dashboard route)
├── App.test.tsx                     (modify: add route test)
├── lib/
│   ├── dashboardStats.ts            (new)
│   └── dashboardStats.test.ts       (new)
├── components/
│   ├── ScoreTrendChart.tsx          (new)
│   └── ScoreTrendChart.test.tsx     (new)
└── pages/
    ├── Home.tsx                     (modify: add Progress Report banner)
    ├── Home.test.tsx                (modify: add banner test)
    ├── Dashboard.tsx                (new)
    └── Dashboard.test.tsx           (new)
```

---

### Task 1: Dashboard data aggregation

**Files:**
- Create: `src/lib/dashboardStats.test.ts`
- Create: `src/lib/dashboardStats.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { getOverallStats, getScoreTrend, getTopicBreakdown } from "./dashboardStats";
import { recordProgress } from "./progress";
import { saveDailyTestResult } from "./dailyTestStorage";
import { topics, words } from "../data/vocabulary";

beforeEach(() => {
  window.localStorage.clear();
});

describe("getOverallStats", () => {
  test("returns 0 known and the full word count when nothing has been learned", () => {
    expect(getOverallStats()).toEqual({ knownCount: 0, totalWords: words.length });
  });

  test("counts only words marked known, not learning", () => {
    recordProgress("animals-dog", "known");
    recordProgress("animals-cat", "learning");
    recordProgress("colors-red", "known");

    expect(getOverallStats()).toEqual({ knownCount: 2, totalWords: words.length });
  });
});

describe("getTopicBreakdown", () => {
  test("returns one entry per topic, in canonical order, all at 0 when nothing is learned", () => {
    const breakdown = getTopicBreakdown();
    expect(breakdown).toHaveLength(topics.length);
    expect(breakdown.map((b) => b.topicId)).toEqual(topics.map((t) => t.id));
    for (const entry of breakdown) {
      expect(entry.knownCount).toBe(0);
      expect(entry.totalCount).toBeGreaterThan(0);
    }
  });

  test("counts known words per topic correctly", () => {
    recordProgress("animals-dog", "known");
    recordProgress("animals-cat", "known");
    recordProgress("animals-fish", "learning");
    recordProgress("colors-red", "known");

    const breakdown = getTopicBreakdown();
    const animals = breakdown.find((b) => b.topicId === "animals")!;
    const colors = breakdown.find((b) => b.topicId === "colors")!;

    expect(animals.knownCount).toBe(2);
    expect(colors.knownCount).toBe(1);
  });
});

describe("getScoreTrend", () => {
  test("returns an empty array when no daily tests have been taken", () => {
    expect(getScoreTrend()).toEqual([]);
  });

  test("maps results to rounded percentages, sorted oldest to newest", () => {
    saveDailyTestResult({ completedAt: 2000, totalQuestions: 20, correctCount: 15, topicStats: {} });
    saveDailyTestResult({ completedAt: 1000, totalQuestions: 3, correctCount: 1, topicStats: {} });

    expect(getScoreTrend()).toEqual([
      { completedAt: 1000, percentage: 33 },
      { completedAt: 2000, percentage: 75 },
    ]);
  });

  test("caps at the given limit, keeping only the most recent entries", () => {
    for (let i = 0; i < 20; i++) {
      saveDailyTestResult({
        completedAt: i,
        totalQuestions: 10,
        correctCount: 10,
        topicStats: {},
      });
    }

    const trend = getScoreTrend(5);
    expect(trend).toHaveLength(5);
    expect(trend.map((p) => p.completedAt)).toEqual([15, 16, 17, 18, 19]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- dashboardStats`
Expected: FAIL — `./dashboardStats` cannot be found.

- [ ] **Step 3: Write `src/lib/dashboardStats.ts`**

```ts
import { getWordsForTopic, topics, words } from "../data/vocabulary";
import { getDailyTestHistory } from "./dailyTestStorage";
import { getAllProgress } from "./progress";

export interface TopicBreakdown {
  topicId: string;
  topicName: string;
  topicEmoji: string;
  knownCount: number;
  totalCount: number;
}

export interface ScoreTrendPoint {
  completedAt: number;
  percentage: number;
}

export function getOverallStats(): { knownCount: number; totalWords: number } {
  const progress = getAllProgress();
  const knownCount = Object.values(progress).filter((p) => p.status === "known").length;
  return { knownCount, totalWords: words.length };
}

export function getTopicBreakdown(): TopicBreakdown[] {
  const progress = getAllProgress();

  return topics.map((topic) => {
    const topicWords = getWordsForTopic(topic.id);
    const knownCount = topicWords.filter((w) => progress[w.id]?.status === "known").length;

    return {
      topicId: topic.id,
      topicName: topic.name,
      topicEmoji: topic.emoji,
      knownCount,
      totalCount: topicWords.length,
    };
  });
}

export function getScoreTrend(limit = 14): ScoreTrendPoint[] {
  const history = getDailyTestHistory();
  const sorted = [...history].sort((a, b) => a.completedAt - b.completedAt);

  return sorted.slice(-limit).map((result) => ({
    completedAt: result.completedAt,
    percentage: Math.round((result.correctCount / result.totalQuestions) * 100),
  }));
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- dashboardStats`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboardStats.ts src/lib/dashboardStats.test.ts
git commit -m "$(cat <<'EOF'
Add dashboard aggregation: overall/topic/score-trend stats

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `ScoreTrendChart` component

**Files:**
- Create: `src/components/ScoreTrendChart.test.tsx`
- Create: `src/components/ScoreTrendChart.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { expect, test } from "vitest";
import { render } from "@testing-library/react";
import ScoreTrendChart from "./ScoreTrendChart";

test("renders a marker for every data point", () => {
  const { container } = render(
    <ScoreTrendChart
      data={[
        { completedAt: 1, percentage: 50 },
        { completedAt: 2, percentage: 80 },
      ]}
    />
  );

  expect(container.querySelectorAll("circle")).toHaveLength(2);
});

test("renders a connecting line when there is more than one point", () => {
  const { container } = render(
    <ScoreTrendChart
      data={[
        { completedAt: 1, percentage: 50 },
        { completedAt: 2, percentage: 80 },
      ]}
    />
  );

  expect(container.querySelector("polyline")).not.toBeNull();
});

test("renders only a single marker and no line for one data point", () => {
  const { container } = render(<ScoreTrendChart data={[{ completedAt: 1, percentage: 60 }]} />);

  expect(container.querySelectorAll("circle")).toHaveLength(1);
  expect(container.querySelector("polyline")).toBeNull();
});

test("labels only the most recent point's percentage", () => {
  const { getByText, queryByText } = render(
    <ScoreTrendChart
      data={[
        { completedAt: 1, percentage: 50 },
        { completedAt: 2, percentage: 80 },
      ]}
    />
  );

  expect(getByText("80%")).toBeInTheDocument();
  expect(queryByText("50%")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- ScoreTrendChart`
Expected: FAIL — `./ScoreTrendChart` cannot be found.

- [ ] **Step 3: Write `src/components/ScoreTrendChart.tsx`**

```tsx
import type { ScoreTrendPoint } from "../lib/dashboardStats";

interface ScoreTrendChartProps {
  data: ScoreTrendPoint[];
}

const WIDTH = 300;
const HEIGHT = 150;
const PADDING = 24;

function xForIndex(index: number, count: number): number {
  if (count <= 1) return PADDING;
  return PADDING + (index / (count - 1)) * (WIDTH - PADDING * 2);
}

function yForPercentage(percentage: number): number {
  return PADDING + (1 - percentage / 100) * (HEIGHT - PADDING * 2);
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const points = data.map((point, index) => ({
    x: xForIndex(index, data.length),
    y: yForPercentage(point.percentage),
    percentage: point.percentage,
  }));

  const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const lastPoint = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Daily Check-up score trend"
    >
      {[0, 50, 100].map((gridValue) => (
        <line
          key={gridValue}
          x1={PADDING}
          y1={yForPercentage(gridValue)}
          x2={WIDTH - PADDING}
          y2={yForPercentage(gridValue)}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
      ))}

      {points.length > 1 && (
        <polyline
          points={linePath}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={5} fill="#0ea5e9" stroke="#ffffff" strokeWidth={2} />
      ))}

      {lastPoint && (
        <text x={lastPoint.x} y={lastPoint.y - 10} textAnchor="end" className="fill-slate-600 text-[10px] font-bold">
          {lastPoint.percentage}%
        </text>
      )}
    </svg>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- ScoreTrendChart`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreTrendChart.tsx src/components/ScoreTrendChart.test.tsx
git commit -m "$(cat <<'EOF'
Add ScoreTrendChart: hand-drawn SVG line chart for daily scores

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `Dashboard` page

**Files:**
- Create: `src/pages/Dashboard.test.tsx`
- Create: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { recordProgress } from "../lib/progress";
import { saveDailyTestResult } from "../lib/dailyTestStorage";
import { topics, words } from "../data/vocabulary";

beforeEach(() => {
  window.localStorage.clear();
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

test("shows the overall known/total count", () => {
  recordProgress("animals-dog", "known");
  recordProgress("colors-red", "known");

  renderDashboard();

  expect(screen.getByText(`2 / ${words.length}`)).toBeInTheDocument();
});

test("shows a row for every topic", () => {
  renderDashboard();

  for (const topic of topics) {
    expect(screen.getByText(topic.name)).toBeInTheDocument();
  }
});

test("shows the empty state with a link to the Daily Check-up when there's no history", () => {
  renderDashboard();

  expect(
    screen.getByText("Take the Daily Check-up to start tracking your progress!")
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go to Daily Check-up" })).toHaveAttribute(
    "href",
    "/daily-test"
  );
});

test("shows the chart instead of the empty state once history exists", () => {
  saveDailyTestResult({ completedAt: 1, totalQuestions: 10, correctCount: 8, topicStats: {} });

  renderDashboard();

  expect(
    screen.queryByText("Take the Daily Check-up to start tracking your progress!")
  ).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Daily Check-up score trend" })).toBeInTheDocument();
});

test("has a link back to Home", () => {
  renderDashboard();
  expect(screen.getByRole("link", { name: "Back to Word Explorer" })).toHaveAttribute("href", "/");
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- Dashboard.test`
Expected: FAIL — `./Dashboard` cannot be found.

- [ ] **Step 3: Write `src/pages/Dashboard.tsx`**

```tsx
import { Link } from "react-router-dom";
import ProgressBar from "../components/ProgressBar";
import ScoreTrendChart from "../components/ScoreTrendChart";
import { getOverallStats, getScoreTrend, getTopicBreakdown } from "../lib/dashboardStats";

export default function Dashboard() {
  const { knownCount, totalWords } = getOverallStats();
  const topicBreakdown = getTopicBreakdown();
  const scoreTrend = getScoreTrend();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-slate-700">
        Progress Report 📊
      </h1>

      <div className="mb-6 rounded-3xl bg-white p-8 text-center shadow-lg">
        <p className="text-5xl font-bold text-emerald-600">
          {knownCount} / {totalWords}
        </p>
        <p className="mt-2 text-lg text-slate-500">words learned</p>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-slate-700">By Topic</h2>
        <div className="flex flex-col gap-3">
          {topicBreakdown.map((topic) => (
            <div key={topic.topicId} className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden="true">
                {topic.topicEmoji}
              </span>
              <span className="w-24 shrink-0 font-bold text-slate-600">{topic.topicName}</span>
              <ProgressBar current={topic.knownCount} total={topic.totalCount} />
              <span className="w-14 shrink-0 text-right text-sm text-slate-500">
                {topic.knownCount}/{topic.totalCount}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-3xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-slate-700">Daily Check-up Progress</h2>
        {scoreTrend.length > 0 ? (
          <ScoreTrendChart data={scoreTrend} />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-lg text-slate-500">
              Take the Daily Check-up to start tracking your progress!
            </p>
            <Link
              to="/daily-test"
              className="rounded-full bg-teal-500 px-6 py-3 text-lg font-bold text-white shadow transition-transform active:scale-95"
            >
              Go to Daily Check-up
            </Link>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <Link
          to="/"
          className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Back to Word Explorer
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- Dashboard.test`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/Dashboard.test.tsx
git commit -m "$(cat <<'EOF'
Add Dashboard page: overall stats, per-topic breakdown, score trend

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Home page Progress Report banner

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Home.test.tsx`

- [ ] **Step 1: Add the new test to `src/pages/Home.test.tsx`**

Append this test to the existing file (keep all four tests already there
from Phases 2–3 unchanged):

```tsx
test("always shows a Progress Report link", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: /Progress Report/ })).toHaveAttribute(
    "href",
    "/dashboard"
  );
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- Home.test`
Expected: FAIL — no "Progress Report" link exists yet.

- [ ] **Step 3: Replace `src/pages/Home.tsx`**

```tsx
import { Link } from "react-router-dom";
import { getTopicById, topics } from "../data/vocabulary";
import TopicTile from "../components/TopicTile";
import { getPlacementResult } from "../lib/placementStorage";
import { findWeakestTopicId } from "../lib/placementTest";

export default function Home() {
  const placementResult = getPlacementResult();
  const weakestTopicId = placementResult
    ? findWeakestTopicId(placementResult.topicStats)
    : undefined;
  const weakestTopic = weakestTopicId ? getTopicById(weakestTopicId) : undefined;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-slate-700">
        Word Explorer 🚀
      </h1>

      {placementResult && weakestTopic ? (
        <div className="mb-4 flex flex-col items-center gap-2 rounded-3xl bg-amber-100 p-4 text-center sm:flex-row sm:justify-between">
          <p className="text-lg font-bold text-amber-700">
            ⭐ Try this next:{" "}
            <Link
              to={`/topic/${weakestTopic.id}`}
              aria-label={`Go to ${weakestTopic.name}`}
              className="underline"
            >
              {weakestTopic.name}
            </Link>
          </p>
          <Link to="/placement-test" className="text-sm font-bold text-amber-600 underline">
            Retake Placement Test
          </Link>
        </div>
      ) : (
        <div className="mb-4 flex justify-center">
          <Link
            to="/placement-test"
            className="rounded-full bg-purple-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
          >
            Take the Placement Test 📝
          </Link>
        </div>
      )}

      <div className="mb-4 flex justify-center">
        <Link
          to="/daily-test"
          className="rounded-full bg-teal-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Daily Check-up 🎯
        </Link>
      </div>

      <div className="mb-6 flex justify-center">
        <Link
          to="/dashboard"
          className="rounded-full bg-indigo-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Progress Report 📊
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topics.map((topic) => (
          <TopicTile key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- Home.test`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx src/pages/Home.test.tsx
git commit -m "$(cat <<'EOF'
Add Progress Report banner to Home

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Wire up the new route in `App`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add the new test to `src/App.test.tsx`**

Append this test to the existing file (keep all four tests already
there unchanged):

```tsx
test("renders the Dashboard at /dashboard", () => {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Progress Report 📊")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- App.test`
Expected: FAIL — no route for `/dashboard` yet.

- [ ] **Step 3: Replace `src/App.tsx`**

```tsx
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TopicScreen from "./pages/TopicScreen";
import Session from "./pages/Session";
import Summary from "./pages/Summary";
import PlacementIntro from "./pages/PlacementIntro";
import PlacementQuiz from "./pages/PlacementQuiz";
import PlacementResults from "./pages/PlacementResults";
import DailyTestIntro from "./pages/DailyTestIntro";
import DailyQuiz from "./pages/DailyQuiz";
import DailyResults from "./pages/DailyResults";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topic/:topicId" element={<TopicScreen />} />
      <Route path="/topic/:topicId/session" element={<Session />} />
      <Route path="/topic/:topicId/summary" element={<Summary />} />
      <Route path="/placement-test" element={<PlacementIntro />} />
      <Route path="/placement-test/quiz" element={<PlacementQuiz />} />
      <Route path="/placement-test/results" element={<PlacementResults />} />
      <Route path="/daily-test" element={<DailyTestIntro />} />
      <Route path="/daily-test/quiz" element={<DailyQuiz />} />
      <Route path="/daily-test/results" element={<DailyResults />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
```

- [ ] **Step 4: Run the full test suite and confirm everything passes**

Run: `npm test`
Expected: PASS, all test files green.

- [ ] **Step 5: Verify the production build still works**

Run: `npm run build`
Expected: no TypeScript errors, `dist/` is created.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "$(cat <<'EOF'
Wire up the dashboard route in App

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Manual browser verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: prints a local URL.

- [ ] **Step 2: Check the empty state**

- With freshly cleared `localStorage`, click "Progress Report 📊" on
  Home.
- Confirm the stat tile shows "0 / 145 words learned", every topic row
  shows a 0% bar, and the score trend section shows the empty-state
  message with a working link to the Daily Check-up.

- [ ] **Step 3: Seed some data and re-check**

- Learn a handful of words across 2–3 different topics (Phase 1 flow,
  marking some "I know it!").
- Take the Daily Check-up 2–3 times (Phase 3 flow), varying how many you
  get right each time.
- Return to the dashboard and confirm: the overall count matches the
  number of words actually marked known; each topic's bar and fraction
  match what you learned in that topic; the score trend chart shows one
  point per Daily Check-up attempt, connected by a line, with only the
  most recent point labeled with its percentage.

- [ ] **Step 4: Sanity-check the chart visually**

- Zoom in on the chart (or resize the window) and confirm: the line and
  markers render cleanly without clipping, the gridlines are faint and
  don't compete with the data, and the label on the last point doesn't
  overlap the marker or get cut off at the chart's edge.

- [ ] **Step 5: Check mobile viewport**

- Resize to a phone-width viewport and confirm the dashboard (stat tile,
  topic list, chart) stays readable and doesn't overflow horizontally.

- [ ] **Step 6: Stop the dev server**

Stop the `npm run dev` process (Ctrl+C).

No commit for this task unless a bug is found — if one is, fix the
underlying code, add/update a test that would have caught it, and commit
that fix separately.
