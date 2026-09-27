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
