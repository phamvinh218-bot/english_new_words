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
