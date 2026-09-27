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
