# Vocabulary Flashcards (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 vocabulary flashcard app: a single child can browse ~145 English words across 13 topics, learn each word from an emoji illustration plus spoken pronunciation, and mark it "known" or "still learning" — with that progress saved locally for later phases to build on.

**Architecture:** A client-only Vite + React + TypeScript SPA. Static vocabulary data lives in one module; per-word progress is persisted to `localStorage` through a small library module; screens are wired together with React Router (`Home` → `TopicScreen` → `Session` → `Summary`), passing session results between routes via router `state`.

**Tech Stack:** Vite, React 18, TypeScript, React Router v6, Tailwind CSS v3, Web Speech API (`window.speechSynthesis`), Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-27-vocabulary-flashcards-phase1-design.md`

---

## File structure (end state after this plan)

```
english_new_words/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── postcss.config.js
├── tailwind.config.js
├── .gitignore
├── docs/superpowers/...
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.test.tsx
    ├── index.css
    ├── types.ts
    ├── test/
    │   └── setup.ts
    ├── data/
    │   ├── vocabulary.ts
    │   └── vocabulary.test.ts
    ├── lib/
    │   ├── progress.ts
    │   ├── progress.test.ts
    │   ├── speech.ts
    │   └── speech.test.ts
    ├── components/
    │   ├── TopicTile.tsx
    │   ├── TopicTile.test.tsx
    │   ├── ProgressBar.tsx
    │   ├── ProgressBar.test.tsx
    │   ├── Flashcard.tsx
    │   └── Flashcard.test.tsx
    └── pages/
        ├── Home.tsx
        ├── Home.test.tsx
        ├── TopicScreen.tsx
        ├── TopicScreen.test.tsx
        ├── Session.tsx
        ├── Session.test.tsx
        ├── Summary.tsx
        └── Summary.test.tsx
```

---

### Task 1: Project scaffold (Vite + React + TypeScript + Tailwind + Router + Vitest)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `postcss.config.js`
- Create: `tailwind.config.js`
- Create: `.gitignore`
- Create: `src/index.css`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/test/setup.ts`
- Create: `src/App.test.tsx`

- [ ] **Step 1: Create `.gitignore`**

```
node_modules
dist
.vite
```

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "english-new-words",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.5.0",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.0",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 4: Create `vite.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&display=swap"
      rel="stylesheet"
    />
    <title>Word Explorer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Baloo 2'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 8: Create `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply font-display bg-slate-50 text-slate-800;
}
```

- [ ] **Step 9: Create `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 10: Create `src/App.tsx` (placeholder, replaced in Task 13)**

```tsx
export default function App() {
  return <div className="p-8 text-2xl">Word Explorer — coming soon</div>;
}
```

- [ ] **Step 11: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 12: Write the placeholder smoke test — `src/App.test.tsx`**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

test("renders placeholder text", () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  expect(screen.getByText(/Word Explorer/i)).toBeInTheDocument();
});
```

- [ ] **Step 13: Install dependencies**

Run: `npm install`
Expected: install completes with no errors, `node_modules/` and `package-lock.json` are created.

- [ ] **Step 14: Verify the test runner works**

Run: `npm test`
Expected: 1 test file, 1 test, PASS.

- [ ] **Step 15: Verify the type-check + production build works**

Run: `npm run build`
Expected: no TypeScript errors, `dist/` is created.

- [ ] **Step 16: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.json vite.config.ts index.html postcss.config.js tailwind.config.js src/index.css src/main.tsx src/App.tsx src/App.test.tsx src/test/setup.ts
git commit -m "$(cat <<'EOF'
Scaffold Vite + React + TypeScript + Tailwind + Vitest project

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Domain types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write the types**

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
```

This file has no runtime behavior (pure type declarations), so there is no
unit test for it — correctness is checked by the TypeScript compiler in the
next step.

- [ ] **Step 2: Verify it type-checks**

Run: `npm run build`
Expected: PASS (no type errors).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "$(cat <<'EOF'
Add domain types for vocabulary, progress, and session results

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Vocabulary data

**Files:**
- Create: `src/data/vocabulary.test.ts`
- Create: `src/data/vocabulary.ts`

- [ ] **Step 1: Write the failing data-integrity test**

```ts
import { describe, expect, test } from "vitest";
import { getTopicById, getWordById, getWordsForTopic, topics, words } from "./vocabulary";

describe("vocabulary data integrity", () => {
  test("every word references a topic that exists", () => {
    const topicIds = new Set(topics.map((t) => t.id));
    for (const word of words) {
      expect(topicIds.has(word.topicId)).toBe(true);
    }
  });

  test("word ids are unique", () => {
    const ids = words.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("topic ids are unique", () => {
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every topic has at least 5 words", () => {
    for (const topic of topics) {
      expect(getWordsForTopic(topic.id).length).toBeGreaterThanOrEqual(5);
    }
  });

  test("getTopicById returns the matching topic", () => {
    expect(getTopicById("animals")?.name).toBe("Animals");
    expect(getTopicById("nonexistent")).toBeUndefined();
  });

  test("getWordById returns the matching word", () => {
    expect(getWordById("animals-dog")?.word).toBe("Dog");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- vocabulary`
Expected: FAIL — `./vocabulary` cannot be found (module doesn't exist yet).

- [ ] **Step 3: Write `src/data/vocabulary.ts`**

```ts
import type { Topic, VocabWord } from "../types";

function slugify(word: string): string {
  return word
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const topics: Topic[] = [
  { id: "colors", name: "Colors", emoji: "🎨", colorClass: "bg-fuchsia-400" },
  { id: "animals", name: "Animals", emoji: "🐶", colorClass: "bg-amber-400" },
  { id: "family", name: "Family", emoji: "👪", colorClass: "bg-rose-400" },
  { id: "food", name: "Food", emoji: "🍎", colorClass: "bg-orange-400" },
  { id: "body", name: "Body", emoji: "🖐️", colorClass: "bg-teal-400" },
  { id: "numbers", name: "Numbers", emoji: "🔢", colorClass: "bg-indigo-400" },
  { id: "toys", name: "Toys", emoji: "🧸", colorClass: "bg-sky-400" },
  { id: "weather", name: "Weather", emoji: "⛅", colorClass: "bg-cyan-400" },
  { id: "clothes", name: "Clothes", emoji: "👕", colorClass: "bg-violet-400" },
  { id: "actions", name: "Actions", emoji: "🏃", colorClass: "bg-lime-500" },
  { id: "school", name: "School", emoji: "🎒", colorClass: "bg-yellow-400" },
  { id: "nature", name: "Nature", emoji: "🌳", colorClass: "bg-green-500" },
  { id: "places", name: "Places", emoji: "🏠", colorClass: "bg-blue-400" },
];

const rawWords: Record<string, Array<[string, string]>> = {
  colors: [
    ["Red", "🔴"],
    ["Orange", "🟠"],
    ["Yellow", "🟡"],
    ["Green", "🟢"],
    ["Blue", "🔵"],
    ["Purple", "🟣"],
    ["Brown", "🟤"],
    ["Black", "⚫"],
    ["White", "⚪"],
    ["Pink", "💗"],
  ],
  animals: [
    ["Dog", "🐶"],
    ["Cat", "🐱"],
    ["Fish", "🐟"],
    ["Bird", "🐦"],
    ["Rabbit", "🐰"],
    ["Horse", "🐴"],
    ["Cow", "🐮"],
    ["Pig", "🐷"],
    ["Sheep", "🐑"],
    ["Duck", "🦆"],
    ["Lion", "🦁"],
    ["Tiger", "🐯"],
    ["Elephant", "🐘"],
    ["Monkey", "🐒"],
    ["Bear", "🐻"],
    ["Frog", "🐸"],
    ["Owl", "🦉"],
  ],
  family: [
    ["Mom", "👩"],
    ["Dad", "👨"],
    ["Sister", "👧"],
    ["Brother", "👦"],
    ["Baby", "👶"],
    ["Grandma", "👵"],
    ["Grandpa", "👴"],
    ["Family", "👨‍👩‍👧‍👦"],
    ["Aunt", "👩"],
    ["Uncle", "👨"],
    ["Cousin", "🧒"],
    ["Pet", "🐾"],
  ],
  food: [
    ["Apple", "🍎"],
    ["Banana", "🍌"],
    ["Bread", "🍞"],
    ["Milk", "🥛"],
    ["Egg", "🥚"],
    ["Rice", "🍚"],
    ["Cake", "🎂"],
    ["Ice Cream", "🍦"],
    ["Juice", "🧃"],
    ["Cheese", "🧀"],
    ["Pizza", "🍕"],
    ["Cookie", "🍪"],
    ["Sandwich", "🥪"],
    ["Soup", "🍲"],
  ],
  body: [
    ["Eye", "👁️"],
    ["Ear", "👂"],
    ["Nose", "👃"],
    ["Mouth", "👄"],
    ["Hand", "✋"],
    ["Foot", "🦶"],
    ["Leg", "🦵"],
    ["Arm", "💪"],
  ],
  numbers: [
    ["One", "1️⃣"],
    ["Two", "2️⃣"],
    ["Three", "3️⃣"],
    ["Four", "4️⃣"],
    ["Five", "5️⃣"],
    ["Six", "6️⃣"],
    ["Seven", "7️⃣"],
    ["Eight", "8️⃣"],
    ["Nine", "9️⃣"],
    ["Ten", "🔟"],
  ],
  toys: [
    ["Ball", "⚽"],
    ["Teddy Bear", "🧸"],
    ["Kite", "🪁"],
    ["Car", "🚗"],
    ["Train", "🚂"],
    ["Balloon", "🎈"],
    ["Robot", "🤖"],
    ["Puzzle", "🧩"],
    ["Blocks", "🧱"],
    ["Drum", "🥁"],
    ["Yo-yo", "🪀"],
  ],
  weather: [
    ["Sun", "☀️"],
    ["Rain", "🌧️"],
    ["Cloud", "☁️"],
    ["Snow", "❄️"],
    ["Wind", "💨"],
    ["Storm", "⛈️"],
    ["Rainbow", "🌈"],
    ["Hot", "🥵"],
    ["Cold", "🥶"],
    ["Lightning", "⚡"],
  ],
  clothes: [
    ["Shirt", "👕"],
    ["Pants", "👖"],
    ["Shoes", "👟"],
    ["Hat", "🧢"],
    ["Socks", "🧦"],
    ["Dress", "👗"],
    ["Jacket", "🧥"],
    ["Scarf", "🧣"],
    ["Gloves", "🧤"],
    ["Boots", "🥾"],
  ],
  actions: [
    ["Run", "🏃"],
    ["Walk", "🚶"],
    ["Swim", "🏊"],
    ["Jump", "🤸"],
    ["Eat", "🍽️"],
    ["Drink", "🥤"],
    ["Sleep", "😴"],
    ["Read", "📖"],
    ["Sing", "🎤"],
    ["Dance", "💃"],
    ["Write", "✍️"],
    ["Fly", "🕊️"],
  ],
  school: [
    ["Pencil", "✏️"],
    ["Ruler", "📏"],
    ["Scissors", "✂️"],
    ["Crayon", "🖍️"],
    ["Paper", "📄"],
    ["Book", "📕"],
    ["Bag", "🎒"],
    ["Teacher", "👩‍🏫"],
    ["Notebook", "📓"],
    ["Chair", "🪑"],
    ["Clock", "🕐"],
    ["Globe", "🌍"],
  ],
  nature: [
    ["Tree", "🌳"],
    ["Flower", "🌸"],
    ["Grass", "🌱"],
    ["Moon", "🌙"],
    ["Star", "⭐"],
    ["Mountain", "⛰️"],
    ["Sea", "🌊"],
    ["Leaf", "🍃"],
    ["Rock", "🪨"],
    ["Beach", "🏖️"],
    ["Butterfly", "🦋"],
  ],
  places: [
    ["House", "🏠"],
    ["Hospital", "🏥"],
    ["Farm", "🚜"],
    ["Shop", "🏪"],
    ["Library", "📚"],
    ["Airport", "✈️"],
    ["Park", "🏞️"],
    ["Street", "🚦"],
  ],
};

export const words: VocabWord[] = Object.entries(rawWords).flatMap(([topicId, entries]) =>
  entries.map(([word, emoji]) => ({
    id: `${topicId}-${slugify(word)}`,
    word,
    topicId,
    emoji,
  }))
);

export function getWordsForTopic(topicId: string): VocabWord[] {
  return words.filter((w) => w.topicId === topicId);
}

export function getTopicById(topicId: string): Topic | undefined {
  return topics.find((t) => t.id === topicId);
}

export function getWordById(wordId: string): VocabWord | undefined {
  return words.find((w) => w.id === wordId);
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- vocabulary`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/data/vocabulary.ts src/data/vocabulary.test.ts
git commit -m "$(cat <<'EOF'
Add vocabulary data: 13 topics, ~145 words

Cambridge Young Learners (Starters)-inspired word list, since no
official Vinschool word list was provided.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Progress persistence library

**Files:**
- Create: `src/lib/progress.test.ts`
- Create: `src/lib/progress.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getAllProgress, getProgress, recordProgress } from "./progress";

beforeEach(() => {
  window.localStorage.clear();
});

describe("progress persistence", () => {
  test("getProgress returns undefined for a word with no recorded progress", () => {
    expect(getProgress("animals-dog")).toBeUndefined();
  });

  test("recordProgress stores status and increments timesSeen", () => {
    recordProgress("animals-dog", "learning");
    const first = getProgress("animals-dog");
    expect(first?.status).toBe("learning");
    expect(first?.timesSeen).toBe(1);

    recordProgress("animals-dog", "known");
    const second = getProgress("animals-dog");
    expect(second?.status).toBe("known");
    expect(second?.timesSeen).toBe(2);
  });

  test("getAllProgress returns every recorded word", () => {
    recordProgress("animals-dog", "known");
    recordProgress("colors-red", "learning");
    const all = getAllProgress();
    expect(Object.keys(all).sort()).toEqual(["animals-dog", "colors-red"]);
  });

  test("getProgress returns undefined if stored JSON is corrupted", () => {
    window.localStorage.setItem("vocab-progress", "{not valid json");
    expect(getProgress("animals-dog")).toBeUndefined();
  });

  test("recordProgress does not throw when localStorage.setItem fails", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    expect(() => recordProgress("animals-dog", "known")).not.toThrow();

    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- progress`
Expected: FAIL — `./progress` cannot be found.

- [ ] **Step 3: Write `src/lib/progress.ts`**

```ts
import type { ProgressStatus, ProgressStore, WordProgress } from "../types";

const STORAGE_KEY = "vocab-progress";

function readStore(): ProgressStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: ProgressStore): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage unavailable (e.g. private browsing) — progress just won't persist.
  }
}

export function getProgress(wordId: string): WordProgress | undefined {
  return readStore()[wordId];
}

export function getAllProgress(): ProgressStore {
  return readStore();
}

export function recordProgress(wordId: string, status: ProgressStatus): WordProgress {
  const store = readStore();
  const existing = store[wordId];
  const updated: WordProgress = {
    status,
    lastSeen: Date.now(),
    timesSeen: (existing?.timesSeen ?? 0) + 1,
  };
  store[wordId] = updated;
  writeStore(store);
  return updated;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- progress`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/progress.ts src/lib/progress.test.ts
git commit -m "$(cat <<'EOF'
Add localStorage-backed progress tracking library

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Pronunciation library

**Files:**
- Create: `src/lib/speech.test.ts`
- Create: `src/lib/speech.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { afterEach, describe, expect, test, vi } from "vitest";
import { isSpeechSupported, speak } from "./speech";

afterEach(() => {
  delete (window as any).speechSynthesis;
  delete (window as any).SpeechSynthesisUtterance;
});

describe("speech", () => {
  test("isSpeechSupported returns false when speechSynthesis is missing", () => {
    expect(isSpeechSupported()).toBe(false);
  });

  test("isSpeechSupported returns true when speechSynthesis exists", () => {
    (window as any).speechSynthesis = { speak: vi.fn(), cancel: vi.fn() };
    expect(isSpeechSupported()).toBe(true);
  });

  test("speak() does nothing when speech is unsupported", () => {
    expect(() => speak("Dog")).not.toThrow();
  });

  test("speak() cancels any pending speech and speaks a slow, en-US utterance", () => {
    const cancel = vi.fn();
    const speakFn = vi.fn();
    (window as any).speechSynthesis = { speak: speakFn, cancel };
    (window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text: string) => ({
      text,
      lang: "",
      rate: 1,
    }));

    speak("Dog");

    expect(cancel).toHaveBeenCalled();
    expect(speakFn).toHaveBeenCalledTimes(1);
    const utterance = speakFn.mock.calls[0][0];
    expect(utterance.text).toBe("Dog");
    expect(utterance.lang).toBe("en-US");
    expect(utterance.rate).toBe(0.85);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- speech`
Expected: FAIL — `./speech` cannot be found.

- [ ] **Step 3: Write `src/lib/speech.ts`**

```ts
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- speech`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/speech.ts src/lib/speech.test.ts
git commit -m "$(cat <<'EOF'
Add Web Speech API wrapper for word pronunciation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `TopicTile` component

**Files:**
- Create: `src/components/TopicTile.test.tsx`
- Create: `src/components/TopicTile.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopicTile from "./TopicTile";
import type { Topic } from "../types";

const topic: Topic = { id: "animals", name: "Animals", emoji: "🐶", colorClass: "bg-amber-400" };

test("renders the topic name, emoji, and links to the topic route", () => {
  render(
    <MemoryRouter>
      <TopicTile topic={topic} />
    </MemoryRouter>
  );

  expect(screen.getByText("Animals")).toBeInTheDocument();
  expect(screen.getByText("🐶")).toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute("href", "/topic/animals");
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- TopicTile`
Expected: FAIL — `./TopicTile` cannot be found.

- [ ] **Step 3: Write `src/components/TopicTile.tsx`**

```tsx
import { Link } from "react-router-dom";
import type { Topic } from "../types";

interface TopicTileProps {
  topic: Topic;
}

export default function TopicTile({ topic }: TopicTileProps) {
  return (
    <Link
      to={`/topic/${topic.id}`}
      className={`flex flex-col items-center justify-center gap-2 rounded-3xl p-6 text-white shadow-md transition-transform hover:scale-105 active:scale-95 ${topic.colorClass}`}
    >
      <span className="text-5xl" aria-hidden="true">
        {topic.emoji}
      </span>
      <span className="text-xl font-bold">{topic.name}</span>
    </Link>
  );
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- TopicTile`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/components/TopicTile.tsx src/components/TopicTile.test.tsx
git commit -m "$(cat <<'EOF'
Add TopicTile component for the topic picker grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `ProgressBar` component

**Files:**
- Create: `src/components/ProgressBar.test.tsx`
- Create: `src/components/ProgressBar.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "./ProgressBar";

test("reflects current progress as a percentage", () => {
  render(<ProgressBar current={3} total={10} />);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "30");
});

test("shows 0% when there are no words", () => {
  render(<ProgressBar current={0} total={0} />);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- ProgressBar`
Expected: FAIL — `./ProgressBar` cannot be found.

- [ ] **Step 3: Write `src/components/ProgressBar.tsx`**

```tsx
interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-4 w-full overflow-hidden rounded-full bg-slate-200"
    >
      <div
        className="h-full rounded-full bg-emerald-400 transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- ProgressBar`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgressBar.tsx src/components/ProgressBar.test.tsx
git commit -m "$(cat <<'EOF'
Add ProgressBar component for the flashcard session

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `Flashcard` component

**Files:**
- Create: `src/components/Flashcard.test.tsx`
- Create: `src/components/Flashcard.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Flashcard from "./Flashcard";
import type { VocabWord } from "../types";

vi.mock("../lib/speech", () => ({
  speak: vi.fn(),
  isSpeechSupported: vi.fn(() => true),
}));

import { isSpeechSupported, speak } from "../lib/speech";

const word: VocabWord = { id: "animals-dog", word: "Dog", topicId: "animals", emoji: "🐶" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isSpeechSupported).mockReturnValue(true);
});

test("shows the word and emoji, and speaks it on mount", () => {
  render(<Flashcard word={word} onAnswer={vi.fn()} />);
  expect(screen.getByText("Dog")).toBeInTheDocument();
  expect(screen.getByText("🐶")).toBeInTheDocument();
  expect(speak).toHaveBeenCalledWith("Dog");
});

test("replays pronunciation when the listen button is clicked", async () => {
  const user = userEvent.setup();
  render(<Flashcard word={word} onAnswer={vi.fn()} />);
  vi.mocked(speak).mockClear();

  await user.click(screen.getByRole("button", { name: "Listen" }));

  expect(speak).toHaveBeenCalledWith("Dog");
});

test("calls onAnswer with 'known' when 'I know it!' is clicked", async () => {
  const user = userEvent.setup();
  const onAnswer = vi.fn();
  render(<Flashcard word={word} onAnswer={onAnswer} />);

  await user.click(screen.getByRole("button", { name: /I know it!/ }));

  expect(onAnswer).toHaveBeenCalledWith("known");
});

test("calls onAnswer with 'learning' when 'Still learning' is clicked", async () => {
  const user = userEvent.setup();
  const onAnswer = vi.fn();
  render(<Flashcard word={word} onAnswer={onAnswer} />);

  await user.click(screen.getByRole("button", { name: /Still learning/ }));

  expect(onAnswer).toHaveBeenCalledWith("learning");
});

test("hides the listen button and shows a note when speech is unsupported", () => {
  vi.mocked(isSpeechSupported).mockReturnValue(false);
  render(<Flashcard word={word} onAnswer={vi.fn()} />);

  expect(screen.queryByRole("button", { name: "Listen" })).not.toBeInTheDocument();
  expect(screen.getByText("Sound isn't available on this device.")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- Flashcard`
Expected: FAIL — `./Flashcard` cannot be found.

- [ ] **Step 3: Write `src/components/Flashcard.tsx`**

```tsx
import { useEffect } from "react";
import { isSpeechSupported, speak } from "../lib/speech";
import type { ProgressStatus, VocabWord } from "../types";

interface FlashcardProps {
  word: VocabWord;
  onAnswer: (status: ProgressStatus) => void;
}

export default function Flashcard({ word, onAnswer }: FlashcardProps) {
  const speechSupported = isSpeechSupported();

  useEffect(() => {
    speak(word.word);
  }, [word]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl bg-white p-10 shadow-lg">
      <span className="text-8xl" aria-hidden="true">
        {word.emoji}
      </span>
      <h2 className="text-4xl font-bold">{word.word}</h2>

      {speechSupported ? (
        <button
          type="button"
          onClick={() => speak(word.word)}
          aria-label="Listen"
          className="rounded-full bg-sky-400 px-6 py-3 text-2xl text-white shadow transition-transform active:scale-95"
        >
          🔊
        </button>
      ) : (
        <p className="text-sm text-slate-400">Sound isn't available on this device.</p>
      )}

      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onAnswer("learning")}
          className="rounded-full bg-amber-400 px-6 py-4 text-lg font-bold text-white shadow transition-transform active:scale-95"
        >
          Still learning 🌱
        </button>
        <button
          type="button"
          onClick={() => onAnswer("known")}
          className="rounded-full bg-emerald-500 px-6 py-4 text-lg font-bold text-white shadow transition-transform active:scale-95"
        >
          I know it! ✅
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- Flashcard`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/Flashcard.tsx src/components/Flashcard.test.tsx
git commit -m "$(cat <<'EOF'
Add Flashcard component with pronunciation and know/learning buttons

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `Home` page

**Files:**
- Create: `src/pages/Home.test.tsx`
- Create: `src/pages/Home.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { topics } from "../data/vocabulary";

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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- Home`
Expected: FAIL — `./Home` cannot be found.

- [ ] **Step 3: Write `src/pages/Home.tsx`**

```tsx
import { topics } from "../data/vocabulary";
import TopicTile from "../components/TopicTile";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-center text-4xl font-extrabold text-slate-700">
        Word Explorer 🚀
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {topics.map((topic) => (
          <TopicTile key={topic.id} topic={topic} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- Home`
Expected: PASS, 1 test.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.tsx src/pages/Home.test.tsx
git commit -m "$(cat <<'EOF'
Add Home page with the topic picker grid

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: `TopicScreen` page

**Files:**
- Create: `src/pages/TopicScreen.test.tsx`
- Create: `src/pages/TopicScreen.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TopicScreen from "./TopicScreen";
import { getWordsForTopic } from "../data/vocabulary";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/topic/:topicId" element={<TopicScreen />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

test("shows the topic name and word count with a Start Learning link", () => {
  renderAt("/topic/animals");

  expect(screen.getByText("Animals")).toBeInTheDocument();
  const wordCount = getWordsForTopic("animals").length;
  expect(screen.getByText(`${wordCount} words to learn`)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Start Learning" })).toHaveAttribute(
    "href",
    "/topic/animals/session"
  );
});

test("redirects to Home for an unknown topic id", () => {
  renderAt("/topic/not-a-real-topic");
  expect(screen.getByText("Home Page")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- TopicScreen`
Expected: FAIL — `./TopicScreen` cannot be found.

- [ ] **Step 3: Write `src/pages/TopicScreen.tsx`**

```tsx
import { Link, Navigate, useParams } from "react-router-dom";
import { getTopicById, getWordsForTopic } from "../data/vocabulary";

export default function TopicScreen() {
  const { topicId } = useParams<{ topicId: string }>();
  const topic = topicId ? getTopicById(topicId) : undefined;

  if (!topic) {
    return <Navigate to="/" replace />;
  }

  const wordCount = getWordsForTopic(topic.id).length;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <span className="text-7xl" aria-hidden="true">
        {topic.emoji}
      </span>
      <h1 className="text-4xl font-extrabold text-slate-700">{topic.name}</h1>
      <p className="text-xl text-slate-500">{wordCount} words to learn</p>
      <Link
        to={`/topic/${topic.id}/session`}
        className="rounded-full bg-emerald-500 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
      >
        Start Learning
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- TopicScreen`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/TopicScreen.tsx src/pages/TopicScreen.test.tsx
git commit -m "$(cat <<'EOF'
Add TopicScreen page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: `Session` page (flashcard session)

**Files:**
- Create: `src/pages/Session.test.tsx`
- Create: `src/pages/Session.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Session from "./Session";
import { getWordsForTopic } from "../data/vocabulary";

vi.mock("../lib/speech", () => ({
  speak: vi.fn(),
  isSpeechSupported: vi.fn(() => true),
}));

vi.mock("../lib/progress", () => ({
  recordProgress: vi.fn(),
}));

import { recordProgress } from "../lib/progress";

function SummaryProbe() {
  const location = useLocation();
  const state = location.state as { results?: { wordId: string; status: string }[] } | null;
  return <div>Summary reached with {state?.results?.length ?? 0} results</div>;
}

function renderSessionAt(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/topic/:topicId/session" element={<Session />} />
        <Route path="/topic/:topicId/summary" element={<SummaryProbe />} />
        <Route path="/topic/:topicId" element={<div>Topic Screen</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

test("shows the first word of the topic and an empty progress bar", () => {
  renderSessionAt("/topic/animals/session");

  const firstWord = getWordsForTopic("animals")[0];
  expect(screen.getByText(firstWord.word)).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
});

test("records progress and advances to the next word", async () => {
  const user = userEvent.setup();
  renderSessionAt("/topic/animals/session");

  const words = getWordsForTopic("animals");
  await user.click(screen.getByRole("button", { name: /I know it!/ }));

  expect(recordProgress).toHaveBeenCalledWith(words[0].id, "known");
  expect(screen.getByText(words[1].word)).toBeInTheDocument();
});

test("navigates to the summary screen with results after the last word", async () => {
  const user = userEvent.setup();
  renderSessionAt("/topic/animals/session", { wordIds: ["animals-dog"] });

  await user.click(screen.getByRole("button", { name: /Still learning/ }));

  expect(screen.getByText("Summary reached with 1 results")).toBeInTheDocument();
});

test("redirects to Home for an unknown topic", () => {
  renderSessionAt("/topic/not-real/session");
  expect(screen.getByText("Home Page")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- Session`
Expected: FAIL — `./Session` cannot be found.

- [ ] **Step 3: Write `src/pages/Session.tsx`**

```tsx
import { useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { getTopicById, getWordById, getWordsForTopic } from "../data/vocabulary";
import { recordProgress } from "../lib/progress";
import Flashcard from "../components/Flashcard";
import ProgressBar from "../components/ProgressBar";
import type { ProgressStatus, SessionResult, VocabWord } from "../types";

interface SessionLocationState {
  wordIds?: string[];
}

export default function Session() {
  const { topicId } = useParams<{ topicId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);

  const topic = topicId ? getTopicById(topicId) : undefined;

  if (!topic) {
    return <Navigate to="/" replace />;
  }

  const state = location.state as SessionLocationState | null;
  const wordIds = state?.wordIds ?? getWordsForTopic(topic.id).map((w) => w.id);
  const sessionWords: VocabWord[] = wordIds
    .map((id) => getWordById(id))
    .filter((w): w is VocabWord => w !== undefined);

  if (sessionWords.length === 0) {
    return <Navigate to={`/topic/${topic.id}`} replace />;
  }

  const currentWord = sessionWords[currentIndex];

  function handleAnswer(status: ProgressStatus) {
    recordProgress(currentWord.id, status);
    const nextResults = [...results, { wordId: currentWord.id, status }];

    if (currentIndex === sessionWords.length - 1) {
      navigate(`/topic/${topic.id}/summary`, { state: { results: nextResults } });
      return;
    }

    setResults(nextResults);
    setCurrentIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6">
      <ProgressBar current={currentIndex} total={sessionWords.length} />
      <Flashcard key={currentWord.id} word={currentWord} onAnswer={handleAnswer} />
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- Session`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Session.tsx src/pages/Session.test.tsx
git commit -m "$(cat <<'EOF'
Add Session page: the flashcard learning loop

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: `Summary` page

**Files:**
- Create: `src/pages/Summary.test.tsx`
- Create: `src/pages/Summary.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Summary from "./Summary";

function SessionProbe() {
  const location = useLocation();
  const state = location.state as { wordIds?: string[] } | null;
  return <div>Session reached with wordIds: {state?.wordIds?.join(",")}</div>;
}

function renderAt(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/topic/:topicId/summary" element={<Summary />} />
        <Route path="/topic/:topicId/session" element={<SessionProbe />} />
        <Route path="/topic/:topicId" element={<div>Topic Screen</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

test("shows counts of known vs still-learning words", () => {
  renderAt("/topic/animals/summary", {
    results: [
      { wordId: "animals-dog", status: "known" },
      { wordId: "animals-cat", status: "learning" },
      { wordId: "animals-fish", status: "known" },
    ],
  });

  expect(screen.getByText("2 words you know! ✅")).toBeInTheDocument();
  expect(screen.getByText("1 words still learning 🌱")).toBeInTheDocument();
});

test("Review again navigates to session with only still-learning word ids", async () => {
  const user = userEvent.setup();
  renderAt("/topic/animals/summary", {
    results: [
      { wordId: "animals-dog", status: "known" },
      { wordId: "animals-cat", status: "learning" },
    ],
  });

  await user.click(screen.getByRole("button", { name: /Review again/ }));

  expect(screen.getByText("Session reached with wordIds: animals-cat")).toBeInTheDocument();
});

test("hides Review again when every word is known", () => {
  renderAt("/topic/animals/summary", {
    results: [{ wordId: "animals-dog", status: "known" }],
  });

  expect(screen.queryByRole("button", { name: /Review again/ })).not.toBeInTheDocument();
});

test("redirects to the topic screen when there are no results in state", () => {
  renderAt("/topic/animals/summary");
  expect(screen.getByText("Topic Screen")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- Summary`
Expected: FAIL — `./Summary` cannot be found.

- [ ] **Step 3: Write `src/pages/Summary.tsx`**

```tsx
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import type { SessionResult } from "../types";

interface SummaryLocationState {
  results?: SessionResult[];
}

export default function Summary() {
  const { topicId } = useParams<{ topicId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as SummaryLocationState | null;
  const results = state?.results;

  if (!topicId || !results) {
    return <Navigate to={topicId ? `/topic/${topicId}` : "/"} replace />;
  }

  const knownCount = results.filter((r) => r.status === "known").length;
  const learningWordIds = results.filter((r) => r.status === "learning").map((r) => r.wordId);

  function handleReviewAgain() {
    navigate(`/topic/${topicId}/session`, { state: { wordIds: learningWordIds } });
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-extrabold text-slate-700">Great job! 🎉</h1>
      <p className="text-2xl text-emerald-600">{knownCount} words you know! ✅</p>
      <p className="text-2xl text-amber-600">{learningWordIds.length} words still learning 🌱</p>
      <div className="flex flex-col gap-3">
        {learningWordIds.length > 0 && (
          <button
            type="button"
            onClick={handleReviewAgain}
            className="rounded-full bg-amber-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
          >
            Review again 🌱
          </button>
        )}
        <Link
          to="/"
          className="rounded-full bg-sky-400 px-8 py-4 text-xl font-bold text-white shadow transition-transform active:scale-95"
        >
          Back to Topics
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npm test -- Summary`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Summary.tsx src/pages/Summary.test.tsx
git commit -m "$(cat <<'EOF'
Add Summary page with known/learning counts and review-again flow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Wire up routing in `App`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Replace the placeholder test in `src/App.test.tsx`**

```tsx
import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

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
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- App.test`
Expected: FAIL — the placeholder `App` doesn't render "Word Explorer 🚀" or a route for `/topic/animals`.

- [ ] **Step 3: Replace `src/App.tsx` with real routing**

```tsx
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import TopicScreen from "./pages/TopicScreen";
import Session from "./pages/Session";
import Summary from "./pages/Summary";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/topic/:topicId" element={<TopicScreen />} />
      <Route path="/topic/:topicId/session" element={<Session />} />
      <Route path="/topic/:topicId/summary" element={<Summary />} />
    </Routes>
  );
}
```

- [ ] **Step 4: Run the full test suite and confirm everything passes**

Run: `npm test`
Expected: PASS, all test files green (App, TopicTile, ProgressBar, Flashcard, Home, TopicScreen, Session, Summary, vocabulary, progress, speech).

- [ ] **Step 5: Verify the production build still works**

Run: `npm run build`
Expected: no TypeScript errors, `dist/` is created.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "$(cat <<'EOF'
Wire up routing between Home, TopicScreen, Session, and Summary

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Manual browser verification

This app's pronunciation and visual/interaction feel can't be meaningfully
covered by automated tests — verify them by hand.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: prints a local URL (e.g. `http://localhost:5173`).

- [ ] **Step 2: Open the app in a browser and check the Home screen**

Navigate to the printed URL. Confirm:
- 13 colorful topic tiles are visible, each with an emoji and a name.
- The layout looks reasonable on both a wide window and a narrow
  (phone-width) window.

- [ ] **Step 3: Walk through a full learning session**

- Click a topic tile (e.g. "Animals") → confirm the topic screen shows the
  correct word count and a "Start Learning" button.
- Click "Start Learning" → confirm the first flashcard appears with a large
  emoji, the English word, and that pronunciation plays automatically
  (turn your device volume on).
- Click the 🔊 button → confirm it replays the same word.
- Click "I know it!" and "Still learning" on different cards → confirm the
  progress bar advances and the next word's card appears each time,
  including a fresh pronunciation playback for the new word.
- After the last card, confirm you land on the Summary screen showing the
  correct counts of known vs. still-learning words.

- [ ] **Step 4: Check the review-again flow**

- On the Summary screen, if "Review again 🌱" is shown, click it and
  confirm only the words you marked "Still learning" appear in the new
  session.
- If every word in the session was marked "known", confirm "Review
  again 🌱" is not shown at all.
- Click "Back to Topics" and confirm it returns to Home.

- [ ] **Step 5: Check graceful degradation**

- Reload the page mid-session (or navigate directly to
  `/topic/animals/summary`) and confirm the app redirects sensibly instead
  of showing a blank or broken screen.

- [ ] **Step 6: Stop the dev server**

Stop the `npm run dev` process (Ctrl+C).

No commit for this task — it's a verification pass, not a code change. If
any check fails, fix the underlying code in the relevant task's files, add
or update a test that would have caught it, and commit that fix.
