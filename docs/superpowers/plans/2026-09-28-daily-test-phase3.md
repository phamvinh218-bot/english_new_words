# Daily Test (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an unlimited-retake, up-to-20-question daily check-up drawn from every word the child has ever seen. Correct answers (re)mark a word "known"; wrong answers mark it "learning" (even if it was "known" before), so it resurfaces in Phase 1 flashcards. Every attempt is appended to a history log in `localStorage` for Phase 4's dashboard to read later.

**Architecture:** Three new routes (`/daily-test`, `/daily-test/quiz`, `/daily-test/results`) that closely mirror Phase 2's placement-test routes and reuse Phase 2's `PlacementQuestionCard` component and `buildChoices`/`computeTopicStats` functions as-is (no renaming, no changes to Phase 2 files). One new library module (`dailyTest.ts`) for question selection and one new storage module (`dailyTestStorage.ts`) that appends to a history array instead of overwriting a single result. Home gets one more banner; no other Phase 1/2 code changes.

**Tech Stack:** Same as Phases 1–2 — Vite, React 18, TypeScript, React Router v6, Tailwind CSS v3, Web Speech API, Vitest + React Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-28-daily-test-phase3-design.md`

**Builds on:** Phase 1 (`feature/vocabulary-flashcards-phase1`) and Phase 2
(`feature/placement-test-phase2`) — this plan assumes `src/types.ts`,
`src/data/vocabulary.ts`, `src/lib/progress.ts`, `src/lib/placementTest.ts`
(specifically its exported `buildChoices` and `computeTopicStats`),
`src/components/PlacementQuestionCard.tsx`, `src/components/ProgressBar.tsx`,
and `src/pages/Home.tsx` already exist as Phase 2 left them.

---

## File structure (new/changed files after this plan)

```
src/
├── App.tsx                          (modify: add 3 routes)
├── App.test.tsx                     (modify: add route test)
├── lib/
│   ├── dailyTest.ts                 (new)
│   ├── dailyTest.test.ts            (new)
│   ├── dailyTestStorage.ts          (new)
│   └── dailyTestStorage.test.ts     (new)
└── pages/
    ├── Home.tsx                     (modify: add Daily Check-up banner)
    ├── Home.test.tsx                (modify: add banner test)
    ├── DailyTestIntro.tsx           (new)
    ├── DailyTestIntro.test.tsx      (new)
    ├── DailyQuiz.tsx                (new)
    ├── DailyQuiz.test.tsx           (new)
    ├── DailyResults.tsx             (new)
    └── DailyResults.test.tsx        (new)
```

---

### Task 1: Daily test question generation

**Files:**
- Create: `src/lib/dailyTest.test.ts`
- Create: `src/lib/dailyTest.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "vitest";
import { generateDailyTest, selectDailyTestWords } from "./dailyTest";
import { words } from "../data/vocabulary";

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe("selectDailyTestWords", () => {
  test("returns up to count words from the seen word ids", () => {
    const seenWordIds = ["animals-dog", "animals-cat", "colors-red", "colors-blue", "food-apple"];
    const selected = selectDailyTestWords(seenWordIds, 3, createSeededRandom(1));

    expect(selected).toHaveLength(3);
    for (const word of selected) {
      expect(seenWordIds).toContain(word.id);
    }
  });

  test("never returns more words than were seen", () => {
    const seenWordIds = ["animals-dog", "animals-cat"];
    const selected = selectDailyTestWords(seenWordIds, 20, createSeededRandom(2));
    expect(selected).toHaveLength(2);
  });

  test("returns an empty array when no words have been seen", () => {
    expect(selectDailyTestWords([], 20, createSeededRandom(3))).toEqual([]);
  });

  test("ignores unresolvable word ids defensively", () => {
    const selected = selectDailyTestWords(
      ["animals-dog", "not-a-real-word"],
      5,
      createSeededRandom(4)
    );
    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe("animals-dog");
  });
});

describe("generateDailyTest", () => {
  test("generates one question per selected word, each with 4 choices containing the answer", () => {
    const seenWordIds = words.slice(0, 25).map((w) => w.id);
    const questions = generateDailyTest(seenWordIds, 20, createSeededRandom(5));

    expect(questions).toHaveLength(20);
    for (const question of questions) {
      expect(question.choices).toHaveLength(4);
      expect(question.choices.map((c) => c.id)).toContain(question.word.id);
      expect(seenWordIds).toContain(question.word.id);
    }
  });

  test("caps at the number of seen words when fewer than count", () => {
    const seenWordIds = ["animals-dog", "animals-cat", "colors-red"];
    const questions = generateDailyTest(seenWordIds, 20, createSeededRandom(6));
    expect(questions).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- dailyTest`
Expected: FAIL — `./dailyTest` cannot be found.

- [ ] **Step 3: Write `src/lib/dailyTest.ts`**

```ts
import { getWordById } from "../data/vocabulary";
import { buildChoices } from "./placementTest";
import type { PlacementQuestion, VocabWord } from "../types";

type RandomFn = () => number;

function shuffle<T>(items: T[], random: RandomFn): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectDailyTestWords(
  seenWordIds: string[],
  count: number,
  random: RandomFn = Math.random
): VocabWord[] {
  const seenWords = seenWordIds
    .map((id) => getWordById(id))
    .filter((w): w is VocabWord => w !== undefined);
  return shuffle(seenWords, random).slice(0, count);
}

export function generateDailyTest(
  seenWordIds: string[],
  count = 20,
  random: RandomFn = Math.random
): PlacementQuestion[] {
  const selectedWords = selectDailyTestWords(seenWordIds, count, random);
  const questions = selectedWords.map((word) => ({
    word,
    choices: buildChoices(word, random),
  }));
  return shuffle(questions, random);
}
```

`shuffle` is duplicated from `placementTest.ts` rather than exported and
shared, to avoid touching Phase 2's stable file for this phase.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- dailyTest`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dailyTest.ts src/lib/dailyTest.test.ts
git commit -m "$(cat <<'EOF'
Add daily test question generation, sampling from seen words

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Daily test history storage

**Files:**
- Create: `src/lib/dailyTestStorage.test.ts`
- Create: `src/lib/dailyTestStorage.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getDailyTestHistory, saveDailyTestResult } from "./dailyTestStorage";
import type { PlacementResult } from "../types";

beforeEach(() => {
  window.localStorage.clear();
});

const resultA: PlacementResult = {
  completedAt: 1000,
  totalQuestions: 20,
  correctCount: 15,
  topicStats: { animals: { correct: 5, total: 5 } },
};

const resultB: PlacementResult = {
  completedAt: 2000,
  totalQuestions: 20,
  correctCount: 18,
  topicStats: { animals: { correct: 5, total: 5 } },
};

describe("daily test history storage", () => {
  test("getDailyTestHistory returns an empty array when nothing is stored", () => {
    expect(getDailyTestHistory()).toEqual([]);
  });

  test("saveDailyTestResult appends to the history", () => {
    saveDailyTestResult(resultA);
    saveDailyTestResult(resultB);
    expect(getDailyTestHistory()).toEqual([resultA, resultB]);
  });

  test("getDailyTestHistory returns an empty array if stored JSON is corrupted", () => {
    window.localStorage.setItem("vocab-daily-test-history", "{not valid json");
    expect(getDailyTestHistory()).toEqual([]);
  });

  test("saveDailyTestResult does not throw when localStorage.setItem fails", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => saveDailyTestResult(resultA)).not.toThrow();

    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- dailyTestStorage`
Expected: FAIL — `./dailyTestStorage` cannot be found.

- [ ] **Step 3: Write `src/lib/dailyTestStorage.ts`**

```ts
import type { PlacementResult } from "../types";

const STORAGE_KEY = "vocab-daily-test-history";

function readHistory(): PlacementResult[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlacementResult[]) : [];
  } catch {
    return [];
  }
}

export function saveDailyTestResult(result: PlacementResult): void {
  try {
    const history = readHistory();
    history.push(result);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage unavailable (e.g. private browsing) — the result just won't persist.
  }
}

export function getDailyTestHistory(): PlacementResult[] {
  return readHistory();
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- dailyTestStorage`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dailyTestStorage.ts src/lib/dailyTestStorage.test.ts
git commit -m "$(cat <<'EOF'
Add append-only localStorage history for daily test results

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `DailyTestIntro` page

**Files:**
- Create: `src/pages/DailyTestIntro.test.tsx`
- Create: `src/pages/DailyTestIntro.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import DailyTestIntro from "./DailyTestIntro";
import { recordProgress } from "../lib/progress";
import type { PlacementQuestion } from "../types";

function QuizProbe() {
  const location = useLocation();
  const state = location.state as { questions?: PlacementQuestion[] } | null;
  return <div>Quiz reached with {state?.questions?.length ?? 0} questions</div>;
}

function renderAt() {
  return render(
    <MemoryRouter initialEntries={["/daily-test"]}>
      <Routes>
        <Route path="/daily-test" element={<DailyTestIntro />} />
        <Route path="/daily-test/quiz" element={<QuizProbe />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

test("shows an empty-state message with no Start button when nothing has been learned yet", () => {
  renderAt();

  expect(
    screen.getByText("Learn some words first, then come back to check up!")
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Start Test" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to Word Explorer" })).toHaveAttribute("href", "/");
});

test("starting the test navigates to the quiz with questions once words have been learned", async () => {
  recordProgress("animals-dog", "known");
  recordProgress("colors-red", "learning");

  const user = userEvent.setup();
  renderAt();

  await user.click(screen.getByRole("button", { name: "Start Test" }));

  expect(screen.getByText("Quiz reached with 2 questions")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- DailyTestIntro`
Expected: FAIL — `./DailyTestIntro` cannot be found.

- [ ] **Step 3: Write `src/pages/DailyTestIntro.tsx`**

```tsx
import { Link, useNavigate } from "react-router-dom";
import { generateDailyTest } from "../lib/dailyTest";
import { getAllProgress } from "../lib/progress";

export default function DailyTestIntro() {
  const navigate = useNavigate();
  const seenWordIds = Object.keys(getAllProgress());

  function handleStart() {
    const questions = generateDailyTest(seenWordIds);
    navigate("/daily-test/quiz", { state: { questions } });
  }

  if (seenWordIds.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
        <h1 className="text-4xl font-extrabold text-slate-700">Daily Check-up 🎯</h1>
        <p className="text-xl text-slate-500">
          Learn some words first, then come back to check up!
        </p>
        <Link
          to="/"
          className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Back to Word Explorer
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Daily Check-up 🎯</h1>
      <p className="text-xl text-slate-500">
        Quick daily check-up! Let's see what you remember.
      </p>
      <button
        type="button"
        onClick={handleStart}
        className="rounded-full bg-emerald-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
      >
        Start Test
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- DailyTestIntro`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DailyTestIntro.tsx src/pages/DailyTestIntro.test.tsx
git commit -m "$(cat <<'EOF'
Add DailyTestIntro page with an empty-state for no progress yet

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `DailyQuiz` page

**Files:**
- Create: `src/pages/DailyQuiz.test.tsx`
- Create: `src/pages/DailyQuiz.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import DailyQuiz from "./DailyQuiz";
import type { PlacementQuestion, PlacementResult } from "../types";

vi.mock("../lib/speech", () => ({
  speak: vi.fn(),
  isSpeechSupported: vi.fn(() => true),
}));

vi.mock("../lib/progress", () => ({
  recordProgress: vi.fn(),
}));

vi.mock("../lib/dailyTestStorage", () => ({
  saveDailyTestResult: vi.fn(),
}));

import { recordProgress } from "../lib/progress";
import { saveDailyTestResult } from "../lib/dailyTestStorage";

const questions: PlacementQuestion[] = [
  {
    word: { id: "animals-dog", word: "Dog", topicId: "animals", emoji: "🐶" },
    choices: [
      { id: "animals-dog", word: "Dog", topicId: "animals", emoji: "🐶" },
      { id: "animals-cat", word: "Cat", topicId: "animals", emoji: "🐱" },
      { id: "animals-fish", word: "Fish", topicId: "animals", emoji: "🐟" },
      { id: "animals-bird", word: "Bird", topicId: "animals", emoji: "🐦" },
    ],
  },
  {
    word: { id: "colors-red", word: "Red", topicId: "colors", emoji: "🔴" },
    choices: [
      { id: "colors-red", word: "Red", topicId: "colors", emoji: "🔴" },
      { id: "colors-blue", word: "Blue", topicId: "colors", emoji: "🔵" },
      { id: "colors-green", word: "Green", topicId: "colors", emoji: "🟢" },
      { id: "colors-yellow", word: "Yellow", topicId: "colors", emoji: "🟡" },
    ],
  },
];

function ResultsProbe() {
  const location = useLocation();
  const state = location.state as { result?: PlacementResult } | null;
  return (
    <div>
      Results reached: {state?.result?.correctCount}/{state?.result?.totalQuestions}
    </div>
  );
}

function renderQuizAt(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/daily-test/quiz", state }]}>
      <Routes>
        <Route path="/daily-test/quiz" element={<DailyQuiz />} />
        <Route path="/daily-test/results" element={<ResultsProbe />} />
        <Route path="/daily-test" element={<div>Intro Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("shows the first question and an empty progress bar", () => {
  renderQuizAt({ questions });
  expect(screen.getByText("Dog")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
});

test("records 'known' for a correct answer and advances", async () => {
  const user = userEvent.setup();
  renderQuizAt({ questions });

  await user.click(screen.getByRole("button", { name: "Dog" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(recordProgress).toHaveBeenCalledWith("animals-dog", "known");
  expect(screen.getByText("Red")).toBeInTheDocument();
});

test("records 'learning' for a wrong answer, downgrading a previously-known word", async () => {
  const user = userEvent.setup();
  renderQuizAt({ questions });

  await user.click(screen.getByRole("button", { name: "Cat" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(recordProgress).toHaveBeenCalledWith("animals-dog", "learning");
});

test("saves the result to daily test history and navigates to results after the last question", async () => {
  const user = userEvent.setup();
  renderQuizAt({ questions });

  await user.click(screen.getByRole("button", { name: "Dog" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Blue" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(saveDailyTestResult).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Results reached: 1/2")).toBeInTheDocument();
});

test("redirects to the intro screen when there are no questions in state", () => {
  renderQuizAt();
  expect(screen.getByText("Intro Page")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- DailyQuiz`
Expected: FAIL — `./DailyQuiz` cannot be found.

- [ ] **Step 3: Write `src/pages/DailyQuiz.tsx`**

```tsx
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import PlacementQuestionCard from "../components/PlacementQuestionCard";
import ProgressBar from "../components/ProgressBar";
import { saveDailyTestResult } from "../lib/dailyTestStorage";
import { computeTopicStats } from "../lib/placementTest";
import { recordProgress } from "../lib/progress";
import type { PlacementAnswer, PlacementQuestion } from "../types";

interface QuizLocationState {
  questions?: PlacementQuestion[];
}

export default function DailyQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);

  const state = location.state as QuizLocationState | null;
  const questions = state?.questions;

  if (!questions || questions.length === 0) {
    return <Navigate to="/daily-test" replace />;
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  function handleNext(answer: PlacementAnswer) {
    recordProgress(answer.wordId, answer.correct ? "known" : "learning");
    const nextAnswers = [...answers, answer];

    if (currentIndex === totalQuestions - 1) {
      const topicStats = computeTopicStats(nextAnswers);
      const result = {
        completedAt: Date.now(),
        totalQuestions: nextAnswers.length,
        correctCount: nextAnswers.filter((a) => a.correct).length,
        topicStats,
      };
      saveDailyTestResult(result);
      navigate("/daily-test/results", { state: { result } });
      return;
    }

    setAnswers(nextAnswers);
    setCurrentIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6">
      <ProgressBar current={currentIndex} total={totalQuestions} />
      <PlacementQuestionCard
        key={currentQuestion.word.id}
        question={currentQuestion}
        onNext={handleNext}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- DailyQuiz`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DailyQuiz.tsx src/pages/DailyQuiz.test.tsx
git commit -m "$(cat <<'EOF'
Add DailyQuiz page: reuses PlacementQuestionCard, downgrades wrong answers

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `DailyResults` page

**Files:**
- Create: `src/pages/DailyResults.test.tsx`
- Create: `src/pages/DailyResults.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DailyResults from "./DailyResults";
import type { PlacementResult } from "../types";

function renderAt(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/daily-test/results", state }]}>
      <Routes>
        <Route path="/daily-test/results" element={<DailyResults />} />
        <Route path="/daily-test" element={<div>Intro Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const result: PlacementResult = {
  completedAt: 1234567890,
  totalQuestions: 20,
  correctCount: 14,
  topicStats: { animals: { correct: 14, total: 20 } },
};

test("shows the score", () => {
  renderAt({ result });
  expect(screen.getByText("14 / 20 correct!")).toBeInTheDocument();
});

test("has a link back to Home", () => {
  renderAt({ result });
  expect(screen.getByRole("link", { name: "Back to Word Explorer" })).toHaveAttribute(
    "href",
    "/"
  );
});

test("redirects to the intro screen when there is no result in state", () => {
  renderAt();
  expect(screen.getByText("Intro Page")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- DailyResults`
Expected: FAIL — `./DailyResults` cannot be found.

- [ ] **Step 3: Write `src/pages/DailyResults.tsx`**

```tsx
import { Link, Navigate, useLocation } from "react-router-dom";
import type { PlacementResult } from "../types";

interface ResultsLocationState {
  result?: PlacementResult;
}

export default function DailyResults() {
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;
  const result = state?.result;

  if (!result) {
    return <Navigate to="/daily-test" replace />;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Check-up Complete! 🎉</h1>
      <p className="text-2xl text-emerald-600">
        {result.correctCount} / {result.totalQuestions} correct!
      </p>
      <p className="text-xl text-slate-500">Great job practicing today!</p>
      <Link
        to="/"
        className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
      >
        Back to Word Explorer
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- DailyResults`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/DailyResults.tsx src/pages/DailyResults.test.tsx
git commit -m "$(cat <<'EOF'
Add DailyResults page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Home page Daily Check-up banner

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Home.test.tsx`

- [ ] **Step 1: Add the new test to `src/pages/Home.test.tsx`**

Append this test to the existing file (keep the three tests already
there from Phase 2 unchanged):

```tsx
test("always shows a Daily Check-up link", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: /Daily Check-up/ })).toHaveAttribute(
    "href",
    "/daily-test"
  );
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- Home.test`
Expected: FAIL — no "Daily Check-up" link exists yet.

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

      <div className="mb-6 flex justify-center">
        <Link
          to="/daily-test"
          className="rounded-full bg-teal-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Daily Check-up 🎯
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
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx src/pages/Home.test.tsx
git commit -m "$(cat <<'EOF'
Add Daily Check-up banner to Home

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Wire up the new routes in `App`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add the new test to `src/App.test.tsx`**

Append this test to the existing file (keep the three tests already
there from Phase 2 unchanged):

```tsx
test("renders the Daily Test intro at /daily-test", () => {
  render(
    <MemoryRouter initialEntries={["/daily-test"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Daily Check-up 🎯")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- App.test`
Expected: FAIL — no route for `/daily-test` yet.

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
Wire up daily test routes in App

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Manual browser verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: prints a local URL.

- [ ] **Step 2: Check the empty state**

- With a freshly cleared `localStorage` (or a browser profile that hasn't
  learned any words), click "Daily Check-up 🎯" on Home.
- Confirm the intro screen shows the "Learn some words first" message and
  no "Start Test" button, and that "Back to Word Explorer" returns Home.

- [ ] **Step 3: Learn a few words, then take the daily test**

- Go learn ~5 words in a topic (Phase 1 flow) so there's something to
  test.
- Return to Home, click "Daily Check-up 🎯" again — confirm this time it
  shows the normal intro with a "Start Test" button.
- Start the test, confirm each question plays pronunciation, shows 4
  choices, and answering shows correct/wrong feedback with a "Next"
  button, same as the placement test.
- Deliberately answer a word you know incorrectly, then finish the test.

- [ ] **Step 4: Confirm the downgrade and results**

- On the results screen, confirm the score is shown and "Back to Word
  Explorer" returns Home.
- Go back into that topic's flashcard session (Phase 1) and confirm the
  word you deliberately got wrong shows up again (i.e. it was moved back
  to "still learning").
- Take the daily test again immediately — confirm it's allowed (no
  once-per-day lock).

- [ ] **Step 5: Check graceful degradation**

- Navigate directly to `/daily-test/quiz` or `/daily-test/results` (no
  prior state) and confirm it redirects to `/daily-test` instead of
  showing a blank/broken page.

- [ ] **Step 6: Stop the dev server**

Stop the `npm run dev` process (Ctrl+C).

No commit for this task unless a bug is found — if one is, fix the
underlying code, add/update a test that would have caught it, and commit
that fix separately.
