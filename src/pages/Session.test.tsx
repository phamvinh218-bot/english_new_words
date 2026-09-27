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
