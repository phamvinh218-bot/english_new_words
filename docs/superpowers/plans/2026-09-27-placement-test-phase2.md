# Placement Test (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 30-question multiple-choice placement test the child can take from Home at any time. Correct answers seed the Phase 1 progress store as "known"; a per-topic score is saved and used to show a single "try this next" recommendation on Home — without disturbing the existing topic grid.

**Architecture:** Three new routes (`/placement-test`, `/placement-test/quiz`, `/placement-test/results`) following the same route-per-screen + router-`state`-handoff pattern Phase 1 established for `Session`/`Summary`. Two new library modules (`placementTest.ts` for question generation/scoring, `placementStorage.ts` for persistence) and one new component (`PlacementQuestionCard`). Home gets a small banner; no other Phase 1 code changes.

**Tech Stack:** Same as Phase 1 — Vite, React 18, TypeScript, React Router v6, Tailwind CSS v3, Web Speech API, Vitest + React Testing Library. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-27-placement-test-phase2-design.md`

**Builds on:** Phase 1 (branch `feature/vocabulary-flashcards-phase1`) — this plan assumes `src/types.ts`, `src/data/vocabulary.ts`, `src/lib/progress.ts`, `src/lib/speech.ts`, `src/components/ProgressBar.tsx`, and `src/pages/Home.tsx` already exist as Phase 1 left them.

---

## File structure (new/changed files after this plan)

```
src/
├── types.ts                         (modify: add placement types)
├── App.tsx                          (modify: add 3 routes)
├── App.test.tsx                     (modify: add route tests)
├── lib/
│   ├── placementTest.ts             (new)
│   ├── placementTest.test.ts        (new)
│   ├── placementStorage.ts          (new)
│   └── placementStorage.test.ts     (new)
├── components/
│   ├── PlacementQuestionCard.tsx    (new)
│   └── PlacementQuestionCard.test.tsx (new)
└── pages/
    ├── Home.tsx                     (modify: add recommendation banner)
    ├── Home.test.tsx                (modify: add banner tests)
    ├── PlacementIntro.tsx           (new)
    ├── PlacementIntro.test.tsx      (new)
    ├── PlacementQuiz.tsx            (new)
    ├── PlacementQuiz.test.tsx       (new)
    ├── PlacementResults.tsx         (new)
    └── PlacementResults.test.tsx    (new)
```

---

### Task 1: Domain types for the placement test

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Append the new types to `src/types.ts`**

Full resulting file content:

```ts
export interface Topic {
  id: string;
  name: string;
  emoji: string;
  colorClass: string;
}

export interface VocabWord {
  id: string;
  word: string;
  topicId: string;
  emoji: string;
}

export type ProgressStatus = "known" | "learning";

export interface WordProgress {
  status: ProgressStatus;
  lastSeen: number;
  timesSeen: number;
}

export type ProgressStore = Record<string, WordProgress>;

export interface SessionResult {
  wordId: string;
  status: ProgressStatus;
}

export interface PlacementQuestion {
  word: VocabWord;
  choices: VocabWord[];
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

export type TopicStats = Record<string, TopicStat>;

export interface PlacementResult {
  completedAt: number;
  totalQuestions: number;
  correctCount: number;
  topicStats: TopicStats;
}
```

No unit test for this file — pure type declarations, verified by the
compiler in the next step.

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "$(cat <<'EOF'
Add placement test domain types

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Question generation and scoring library

**Files:**
- Create: `src/lib/placementTest.test.ts`
- Create: `src/lib/placementTest.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "vitest";
import {
  buildChoices,
  computeTopicStats,
  findWeakestTopicId,
  generatePlacementTest,
  selectPlacementWords,
} from "./placementTest";
import { topics, words } from "../data/vocabulary";

function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

describe("selectPlacementWords", () => {
  test("selects the requested number of unique words", () => {
    const selected = selectPlacementWords(30, createSeededRandom(1));
    expect(selected).toHaveLength(30);
    expect(new Set(selected.map((w) => w.id)).size).toBe(30);
  });

  test("draws from every topic", () => {
    const selected = selectPlacementWords(30, createSeededRandom(2));
    const topicIds = new Set(selected.map((w) => w.topicId));
    expect(topicIds.size).toBe(topics.length);
  });

  test("never selects more words than exist", () => {
    const selected = selectPlacementWords(10000, createSeededRandom(3));
    expect(selected.length).toBe(words.length);
  });
});

describe("buildChoices", () => {
  test("returns 4 unique choices including the target word, all from its topic", () => {
    const word = words.find((w) => w.id === "animals-dog")!;
    const choices = buildChoices(word, createSeededRandom(4));

    expect(choices).toHaveLength(4);
    expect(new Set(choices.map((c) => c.id)).size).toBe(4);
    expect(choices.map((c) => c.id)).toContain(word.id);
    for (const choice of choices) {
      expect(choice.topicId).toBe("animals");
    }
  });
});

describe("generatePlacementTest", () => {
  test("generates the requested number of questions, each with 4 choices containing the answer", () => {
    const test_ = generatePlacementTest(30, createSeededRandom(5));
    expect(test_).toHaveLength(30);
    for (const question of test_) {
      expect(question.choices).toHaveLength(4);
      expect(question.choices.map((c) => c.id)).toContain(question.word.id);
    }
  });
});

describe("computeTopicStats", () => {
  test("tallies correct and total per topic", () => {
    const stats = computeTopicStats([
      { wordId: "animals-dog", topicId: "animals", correct: true },
      { wordId: "animals-cat", topicId: "animals", correct: false },
      { wordId: "colors-red", topicId: "colors", correct: true },
    ]);

    expect(stats).toEqual({
      animals: { correct: 1, total: 2 },
      colors: { correct: 1, total: 1 },
    });
  });
});

describe("findWeakestTopicId", () => {
  test("returns the topic with the lowest correct ratio", () => {
    const weakest = findWeakestTopicId({
      animals: { correct: 8, total: 10 },
      colors: { correct: 1, total: 10 },
      food: { correct: 5, total: 10 },
    });

    expect(weakest).toBe("colors");
  });

  test("breaks ties using canonical topic order", () => {
    const weakest = findWeakestTopicId({
      food: { correct: 5, total: 10 },
      colors: { correct: 5, total: 10 },
    });

    expect(weakest).toBe("colors");
  });

  test("returns undefined when there are no stats", () => {
    expect(findWeakestTopicId({})).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- placementTest`
Expected: FAIL — `./placementTest` cannot be found.

- [ ] **Step 3: Write `src/lib/placementTest.ts`**

```ts
import { getWordsForTopic, topics } from "../data/vocabulary";
import type { PlacementAnswer, PlacementQuestion, TopicStats, VocabWord } from "../types";

type RandomFn = () => number;

function shuffle<T>(items: T[], random: RandomFn): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectPlacementWords(
  count: number,
  random: RandomFn = Math.random
): VocabWord[] {
  const remainingByTopic = new Map(
    topics.map((topic) => [topic.id, shuffle(getWordsForTopic(topic.id), random)])
  );
  const shuffledTopicIds = shuffle(
    topics.map((topic) => topic.id),
    random
  );
  const selected: VocabWord[] = [];

  while (selected.length < count) {
    let pickedAny = false;

    for (const topicId of shuffledTopicIds) {
      if (selected.length >= count) break;

      const pool = remainingByTopic.get(topicId)!;
      const next = pool.pop();
      if (next) {
        selected.push(next);
        pickedAny = true;
      }
    }

    if (!pickedAny) break;
  }

  return selected;
}

export function buildChoices(word: VocabWord, random: RandomFn = Math.random): VocabWord[] {
  const sameTopicOthers = getWordsForTopic(word.topicId).filter((w) => w.id !== word.id);
  const distractors = shuffle(sameTopicOthers, random).slice(0, 3);
  return shuffle([word, ...distractors], random);
}

export function generatePlacementTest(
  count = 30,
  random: RandomFn = Math.random
): PlacementQuestion[] {
  const selectedWords = selectPlacementWords(count, random);
  const questions = selectedWords.map((word) => ({
    word,
    choices: buildChoices(word, random),
  }));
  return shuffle(questions, random);
}

export function computeTopicStats(answers: PlacementAnswer[]): TopicStats {
  const stats: TopicStats = {};

  for (const answer of answers) {
    const stat = stats[answer.topicId] ?? { correct: 0, total: 0 };
    stat.total += 1;
    if (answer.correct) {
      stat.correct += 1;
    }
    stats[answer.topicId] = stat;
  }

  return stats;
}

export function findWeakestTopicId(stats: TopicStats): string | undefined {
  let weakestId: string | undefined;
  let weakestRatio = Infinity;

  for (const topic of topics) {
    const stat = stats[topic.id];
    if (!stat || stat.total === 0) continue;

    const ratio = stat.correct / stat.total;
    if (ratio < weakestRatio) {
      weakestRatio = ratio;
      weakestId = topic.id;
    }
  }

  return weakestId;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- placementTest`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/placementTest.ts src/lib/placementTest.test.ts
git commit -m "$(cat <<'EOF'
Add placement test question generation and scoring library

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Placement result persistence library

**Files:**
- Create: `src/lib/placementStorage.test.ts`
- Create: `src/lib/placementStorage.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getPlacementResult, savePlacementResult } from "./placementStorage";
import type { PlacementResult } from "../types";

beforeEach(() => {
  window.localStorage.clear();
});

const sampleResult: PlacementResult = {
  completedAt: 1234567890,
  totalQuestions: 30,
  correctCount: 22,
  topicStats: { animals: { correct: 8, total: 10 } },
};

describe("placement result storage", () => {
  test("getPlacementResult returns undefined when nothing is stored", () => {
    expect(getPlacementResult()).toBeUndefined();
  });

  test("savePlacementResult persists and getPlacementResult reads it back", () => {
    savePlacementResult(sampleResult);
    expect(getPlacementResult()).toEqual(sampleResult);
  });

  test("savePlacementResult overwrites a previous result", () => {
    savePlacementResult(sampleResult);
    const updated: PlacementResult = { ...sampleResult, correctCount: 25 };
    savePlacementResult(updated);
    expect(getPlacementResult()).toEqual(updated);
  });

  test("getPlacementResult returns undefined if stored JSON is corrupted", () => {
    window.localStorage.setItem("vocab-placement", "{not valid json");
    expect(getPlacementResult()).toBeUndefined();
  });

  test("savePlacementResult does not throw when localStorage.setItem fails", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => savePlacementResult(sampleResult)).not.toThrow();

    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- placementStorage`
Expected: FAIL — `./placementStorage` cannot be found.

- [ ] **Step 3: Write `src/lib/placementStorage.ts`**

```ts
import type { PlacementResult } from "../types";

const STORAGE_KEY = "vocab-placement";

export function savePlacementResult(result: PlacementResult): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // localStorage unavailable (e.g. private browsing) — the result just won't persist.
  }
}

export function getPlacementResult(): PlacementResult | undefined {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PlacementResult) : undefined;
  } catch {
    return undefined;
  }
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- placementStorage`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/placementStorage.ts src/lib/placementStorage.test.ts
git commit -m "$(cat <<'EOF'
Add localStorage-backed placement result persistence

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `PlacementQuestionCard` component

**Files:**
- Create: `src/components/PlacementQuestionCard.test.tsx`
- Create: `src/components/PlacementQuestionCard.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PlacementQuestionCard from "./PlacementQuestionCard";
import type { PlacementQuestion } from "../types";

vi.mock("../lib/speech", () => ({
  speak: vi.fn(),
  isSpeechSupported: vi.fn(() => true),
}));

import { isSpeechSupported, speak } from "../lib/speech";

const question: PlacementQuestion = {
  word: { id: "animals-dog", word: "Dog", topicId: "animals", emoji: "🐶" },
  choices: [
    { id: "animals-dog", word: "Dog", topicId: "animals", emoji: "🐶" },
    { id: "animals-cat", word: "Cat", topicId: "animals", emoji: "🐱" },
    { id: "animals-fish", word: "Fish", topicId: "animals", emoji: "🐟" },
    { id: "animals-bird", word: "Bird", topicId: "animals", emoji: "🐦" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isSpeechSupported).mockReturnValue(true);
});

test("shows the target word and speaks it on mount", () => {
  render(<PlacementQuestionCard question={question} onNext={vi.fn()} />);
  expect(screen.getByText("Dog")).toBeInTheDocument();
  expect(speak).toHaveBeenCalledWith("Dog");
});

test("shows all 4 choices as buttons", () => {
  render(<PlacementQuestionCard question={question} onNext={vi.fn()} />);
  for (const choice of question.choices) {
    expect(screen.getByRole("button", { name: choice.word })).toBeInTheDocument();
  }
});

test("selecting a choice shows feedback, disables all choices, and reveals Next", async () => {
  const user = userEvent.setup();
  render(<PlacementQuestionCard question={question} onNext={vi.fn()} />);

  await user.click(screen.getByRole("button", { name: "Dog" }));

  expect(screen.getByRole("button", { name: "Dog" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cat" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
});

test("clicking Next after a correct answer reports correct: true", async () => {
  const user = userEvent.setup();
  const onNext = vi.fn();
  render(<PlacementQuestionCard question={question} onNext={onNext} />);

  await user.click(screen.getByRole("button", { name: "Dog" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(onNext).toHaveBeenCalledWith({ wordId: "animals-dog", topicId: "animals", correct: true });
});

test("clicking Next after a wrong answer reports correct: false", async () => {
  const user = userEvent.setup();
  const onNext = vi.fn();
  render(<PlacementQuestionCard question={question} onNext={onNext} />);

  await user.click(screen.getByRole("button", { name: "Cat" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(onNext).toHaveBeenCalledWith({ wordId: "animals-dog", topicId: "animals", correct: false });
});

test("further clicks after answering don't change the selection", async () => {
  const user = userEvent.setup();
  const onNext = vi.fn();
  render(<PlacementQuestionCard question={question} onNext={onNext} />);

  await user.click(screen.getByRole("button", { name: "Dog" }));
  await user.click(screen.getByRole("button", { name: "Cat" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(onNext).toHaveBeenCalledTimes(1);
  expect(onNext).toHaveBeenCalledWith({ wordId: "animals-dog", topicId: "animals", correct: true });
});

test("hides the listen button and shows a note when speech is unsupported", () => {
  vi.mocked(isSpeechSupported).mockReturnValue(false);
  render(<PlacementQuestionCard question={question} onNext={vi.fn()} />);

  expect(screen.queryByRole("button", { name: "Listen" })).not.toBeInTheDocument();
  expect(screen.getByText("Sound isn't available on this device.")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- PlacementQuestionCard`
Expected: FAIL — `./PlacementQuestionCard` cannot be found.

- [ ] **Step 3: Write `src/components/PlacementQuestionCard.tsx`**

```tsx
import { useEffect, useState } from "react";
import { isSpeechSupported, speak } from "../lib/speech";
import type { PlacementAnswer, PlacementQuestion } from "../types";

interface PlacementQuestionCardProps {
  question: PlacementQuestion;
  onNext: (answer: PlacementAnswer) => void;
}

export default function PlacementQuestionCard({ question, onNext }: PlacementQuestionCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const speechSupported = isSpeechSupported();

  useEffect(() => {
    setSelectedId(null);
    speak(question.word.word);
  }, [question]);

  function handleSelect(choiceId: string) {
    if (selectedId) return;
    setSelectedId(choiceId);
  }

  function handleNext() {
    if (!selectedId) return;
    onNext({
      wordId: question.word.id,
      topicId: question.word.topicId,
      correct: selectedId === question.word.id,
    });
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-10 shadow-lg">
      <h2 className="text-4xl font-bold">{question.word.word}</h2>

      {speechSupported ? (
        <button
          type="button"
          onClick={() => speak(question.word.word)}
          aria-label="Listen"
          className="rounded-full bg-sky-400 px-6 py-3 text-2xl text-white shadow transition-transform active:scale-95"
        >
          🔊
        </button>
      ) : (
        <p className="text-sm text-slate-400">Sound isn't available on this device.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {question.choices.map((choice) => {
          const isCorrectChoice = choice.id === question.word.id;
          const isSelected = choice.id === selectedId;
          const showFeedback = selectedId !== null;

          let stateClass = "bg-slate-100 hover:bg-slate-200";
          if (showFeedback && isCorrectChoice) {
            stateClass = "bg-emerald-400";
          } else if (showFeedback && isSelected) {
            stateClass = "bg-rose-400";
          }

          return (
            <button
              key={choice.id}
              type="button"
              disabled={selectedId !== null}
              onClick={() => handleSelect(choice.id)}
              aria-label={choice.word}
              className={`flex h-28 w-28 items-center justify-center rounded-3xl text-6xl shadow transition-colors ${stateClass}`}
            >
              <span aria-hidden="true">{choice.emoji}</span>
            </button>
          );
        })}
      </div>

      {selectedId && (
        <button
          type="button"
          onClick={handleNext}
          className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Next
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- PlacementQuestionCard`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/PlacementQuestionCard.tsx src/components/PlacementQuestionCard.test.tsx
git commit -m "$(cat <<'EOF'
Add PlacementQuestionCard: multiple-choice question with feedback

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `PlacementIntro` page

**Files:**
- Create: `src/pages/PlacementIntro.test.tsx`
- Create: `src/pages/PlacementIntro.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import PlacementIntro from "./PlacementIntro";
import type { PlacementQuestion } from "../types";

function QuizProbe() {
  const location = useLocation();
  const state = location.state as { questions?: PlacementQuestion[] } | null;
  return <div>Quiz reached with {state?.questions?.length ?? 0} questions</div>;
}

test("shows an explanation and starting the test navigates to the quiz with 30 questions", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/placement-test"]}>
      <Routes>
        <Route path="/placement-test" element={<PlacementIntro />} />
        <Route path="/placement-test/quiz" element={<QuizProbe />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText("Placement Test 📝")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Start Test" }));

  expect(screen.getByText("Quiz reached with 30 questions")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- PlacementIntro`
Expected: FAIL — `./PlacementIntro` cannot be found.

- [ ] **Step 3: Write `src/pages/PlacementIntro.tsx`**

```tsx
import { useNavigate } from "react-router-dom";
import { generatePlacementTest } from "../lib/placementTest";

export default function PlacementIntro() {
  const navigate = useNavigate();

  function handleStart() {
    const questions = generatePlacementTest();
    navigate("/placement-test/quiz", { state: { questions } });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Placement Test 📝</h1>
      <p className="text-xl text-slate-500">
        Listen to each word, then pick the picture that matches. 30 questions!
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

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- PlacementIntro`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PlacementIntro.tsx src/pages/PlacementIntro.test.tsx
git commit -m "$(cat <<'EOF'
Add PlacementIntro page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `PlacementQuiz` page

**Files:**
- Create: `src/pages/PlacementQuiz.test.tsx`
- Create: `src/pages/PlacementQuiz.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import PlacementQuiz from "./PlacementQuiz";
import type { PlacementQuestion, PlacementResult } from "../types";

vi.mock("../lib/speech", () => ({
  speak: vi.fn(),
  isSpeechSupported: vi.fn(() => true),
}));

vi.mock("../lib/progress", () => ({
  recordProgress: vi.fn(),
}));

vi.mock("../lib/placementStorage", () => ({
  savePlacementResult: vi.fn(),
}));

import { recordProgress } from "../lib/progress";
import { savePlacementResult } from "../lib/placementStorage";

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
    <MemoryRouter initialEntries={[{ pathname: "/placement-test/quiz", state }]}>
      <Routes>
        <Route path="/placement-test/quiz" element={<PlacementQuiz />} />
        <Route path="/placement-test/results" element={<ResultsProbe />} />
        <Route path="/placement-test" element={<div>Intro Page</div>} />
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

test("records progress only for correct answers and advances to the next question", async () => {
  const user = userEvent.setup();
  renderQuizAt({ questions });

  await user.click(screen.getByRole("button", { name: "Dog" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(recordProgress).toHaveBeenCalledWith("animals-dog", "known");
  expect(screen.getByText("Red")).toBeInTheDocument();
});

test("does not record progress for a wrong answer", async () => {
  const user = userEvent.setup();
  renderQuizAt({ questions });

  await user.click(screen.getByRole("button", { name: "Cat" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(recordProgress).not.toHaveBeenCalled();
});

test("saves the result and navigates to results after the last question", async () => {
  const user = userEvent.setup();
  renderQuizAt({ questions });

  await user.click(screen.getByRole("button", { name: "Dog" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Blue" }));
  await user.click(screen.getByRole("button", { name: "Next" }));

  expect(savePlacementResult).toHaveBeenCalledTimes(1);
  expect(screen.getByText("Results reached: 1/2")).toBeInTheDocument();
});

test("redirects to the intro screen when there are no questions in state", () => {
  renderQuizAt();
  expect(screen.getByText("Intro Page")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- PlacementQuiz`
Expected: FAIL — `./PlacementQuiz` cannot be found.

- [ ] **Step 3: Write `src/pages/PlacementQuiz.tsx`**

```tsx
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import PlacementQuestionCard from "../components/PlacementQuestionCard";
import ProgressBar from "../components/ProgressBar";
import { computeTopicStats } from "../lib/placementTest";
import { savePlacementResult } from "../lib/placementStorage";
import { recordProgress } from "../lib/progress";
import type { PlacementAnswer, PlacementQuestion } from "../types";

interface QuizLocationState {
  questions?: PlacementQuestion[];
}

export default function PlacementQuiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<PlacementAnswer[]>([]);

  const state = location.state as QuizLocationState | null;
  const questions = state?.questions;

  if (!questions || questions.length === 0) {
    return <Navigate to="/placement-test" replace />;
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  function handleNext(answer: PlacementAnswer) {
    if (answer.correct) {
      recordProgress(answer.wordId, "known");
    }
    const nextAnswers = [...answers, answer];

    if (currentIndex === totalQuestions - 1) {
      const topicStats = computeTopicStats(nextAnswers);
      const result = {
        completedAt: Date.now(),
        totalQuestions: nextAnswers.length,
        correctCount: nextAnswers.filter((a) => a.correct).length,
        topicStats,
      };
      savePlacementResult(result);
      navigate("/placement-test/results", { state: { result } });
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

Run: `npm test -- PlacementQuiz`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PlacementQuiz.tsx src/pages/PlacementQuiz.test.tsx
git commit -m "$(cat <<'EOF'
Add PlacementQuiz page: the multiple-choice question loop

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `PlacementResults` page

**Files:**
- Create: `src/pages/PlacementResults.test.tsx`
- Create: `src/pages/PlacementResults.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PlacementResults from "./PlacementResults";
import type { PlacementResult } from "../types";

function renderAt(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/placement-test/results", state }]}>
      <Routes>
        <Route path="/placement-test/results" element={<PlacementResults />} />
        <Route path="/placement-test" element={<div>Intro Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/topic/:topicId" element={<div>Topic Screen</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const result: PlacementResult = {
  completedAt: 1234567890,
  totalQuestions: 2,
  correctCount: 1,
  topicStats: {
    animals: { correct: 1, total: 1 },
    colors: { correct: 0, total: 1 },
  },
};

test("shows the score and a recommendation for the weakest topic", () => {
  renderAt({ result });

  expect(screen.getByText("1 / 2 correct!")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Colors/ })).toHaveAttribute("href", "/topic/colors");
});

test("has a link back to Home", () => {
  renderAt({ result });
  expect(screen.getByRole("link", { name: "Continue to Word Explorer" })).toHaveAttribute(
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

Run: `npm test -- PlacementResults`
Expected: FAIL — `./PlacementResults` cannot be found.

- [ ] **Step 3: Write `src/pages/PlacementResults.tsx`**

```tsx
import { Link, Navigate, useLocation } from "react-router-dom";
import { getTopicById } from "../data/vocabulary";
import { findWeakestTopicId } from "../lib/placementTest";
import type { PlacementResult } from "../types";

interface ResultsLocationState {
  result?: PlacementResult;
}

export default function PlacementResults() {
  const location = useLocation();
  const state = location.state as ResultsLocationState | null;
  const result = state?.result;

  if (!result) {
    return <Navigate to="/placement-test" replace />;
  }

  const weakestTopicId = findWeakestTopicId(result.topicStats);
  const weakestTopic = weakestTopicId ? getTopicById(weakestTopicId) : undefined;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Test Complete! 🎉</h1>
      <p className="text-2xl text-emerald-600">
        {result.correctCount} / {result.totalQuestions} correct!
      </p>

      {weakestTopic && (
        <div className="rounded-3xl bg-amber-100 p-6">
          <p className="text-lg text-amber-700">⭐ Try this next:</p>
          <Link
            to={`/topic/${weakestTopic.id}`}
            className="mt-2 inline-block rounded-full bg-amber-400 px-6 py-3 text-lg font-bold text-white shadow transition-transform active:scale-95"
          >
            {weakestTopic.emoji} {weakestTopic.name}
          </Link>
        </div>
      )}

      <Link
        to="/"
        className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
      >
        Continue to Word Explorer
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- PlacementResults`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/PlacementResults.tsx src/pages/PlacementResults.test.tsx
git commit -m "$(cat <<'EOF'
Add PlacementResults page with score and weakest-topic recommendation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Home page recommendation banner

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/pages/Home.test.tsx`

- [ ] **Step 1: Replace `src/pages/Home.test.tsx` with the extended tests**

```tsx
import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { topics } from "../data/vocabulary";
import { savePlacementResult } from "../lib/placementStorage";

beforeEach(() => {
  window.localStorage.clear();
});

test("renders a tile for every topic", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

  for (const topic of topics) {
    expect(screen.getByText(topic.name)).toBeInTheDocument();
  }
});

test("shows a Take the Placement Test link when no result is stored", () => {
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: /Take the Placement Test/ })).toHaveAttribute(
    "href",
    "/placement-test"
  );
});

test("shows a recommendation banner and Retake link when a result is stored", () => {
  savePlacementResult({
    completedAt: Date.now(),
    totalQuestions: 2,
    correctCount: 1,
    topicStats: {
      animals: { correct: 1, total: 1 },
      colors: { correct: 0, total: 1 },
    },
  });

  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

  expect(screen.getByRole("link", { name: "Go to Colors" })).toHaveAttribute(
    "href",
    "/topic/colors"
  );
  expect(screen.getByRole("link", { name: "Retake Placement Test" })).toHaveAttribute(
    "href",
    "/placement-test"
  );
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- Home.test`
Expected: FAIL — Home doesn't yet render the placement-test banner/links.

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
        <div className="mb-6 flex flex-col items-center gap-2 rounded-3xl bg-amber-100 p-4 text-center sm:flex-row sm:justify-between">
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
        <div className="mb-6 flex justify-center">
          <Link
            to="/placement-test"
            className="rounded-full bg-purple-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
          >
            Take the Placement Test 📝
          </Link>
        </div>
      )}

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
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx src/pages/Home.test.tsx
git commit -m "$(cat <<'EOF'
Add placement test banner to Home

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Wire up the new routes in `App`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Replace `src/App.test.tsx` with the extended tests**

```tsx
import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

beforeEach(() => {
  window.localStorage.clear();
});

test("renders the Home screen at the root route", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Word Explorer 🚀")).toBeInTheDocument();
});

test("renders the Topic screen at /topic/:topicId", () => {
  render(
    <MemoryRouter initialEntries={["/topic/animals"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Animals")).toBeInTheDocument();
});

test("renders the Placement Test intro at /placement-test", () => {
  render(
    <MemoryRouter initialEntries={["/placement-test"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Placement Test 📝")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- App.test`
Expected: FAIL — no route for `/placement-test` yet.

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
Wire up placement test routes in App

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Manual browser verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: prints a local URL.

- [ ] **Step 2: Take the placement test from Home**

- On Home, confirm a "Take the Placement Test 📝" button is visible above
  the topic grid.
- Click it → confirm the intro screen explains the test → click "Start
  Test".
- Confirm each question plays pronunciation automatically, shows the word
  text, and 4 emoji choices from the same topic.
- Answer a mix of correct and incorrect — confirm tapping a choice
  immediately shows green (correct) / red (wrong tap) feedback, disables
  all 4 choices, and reveals "Next"; confirm "Next" advances and the
  progress bar updates.

- [ ] **Step 3: Check the results screen**

- After the last question, confirm you land on a results screen showing
  the correct score and a "⭐ Try this next" recommendation linking to a
  real topic screen.
- Click "Continue to Word Explorer" → confirm you're back on Home, and
  the banner now shows "⭐ Try this next: `<topic>`" with a "Retake
  Placement Test" link instead of the original "Take the Placement Test"
  button.

- [ ] **Step 4: Confirm progress was seeded**

- Open a topic where you answered correctly during the test and start a
  learning session — confirm the app still runs correctly end-to-end (the
  seeded "known" words don't need to show any special UI in Phase 1, just
  confirm nothing is broken).

- [ ] **Step 5: Check graceful degradation**

- Navigate directly to `/placement-test/quiz` or `/placement-test/results`
  (no prior state, e.g. paste the URL) and confirm it redirects to the
  intro screen instead of showing a blank/broken page.

- [ ] **Step 6: Stop the dev server**

Stop the `npm run dev` process (Ctrl+C).

No commit for this task unless a bug is found — if one is, fix the
underlying code, add/update a test that would have caught it, and commit
that fix separately.
