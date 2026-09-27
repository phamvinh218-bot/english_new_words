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
