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
