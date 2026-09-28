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
