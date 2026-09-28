import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "./Dashboard";
import { recordProgress } from "../lib/progress";
import { saveDailyTestResult } from "../lib/dailyTestStorage";
import { topics, words } from "../data/vocabulary";

beforeEach(() => {
  window.localStorage.clear();
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

test("shows the overall known/total count", () => {
  recordProgress("animals-dog", "known");
  recordProgress("colors-red", "known");

  renderDashboard();

  expect(screen.getByText(`2 / ${words.length}`)).toBeInTheDocument();
});

test("shows a row for every topic", () => {
  renderDashboard();

  for (const topic of topics) {
    expect(screen.getByText(topic.name)).toBeInTheDocument();
  }
});

test("shows the empty state with a link to the Daily Check-up when there's no history", () => {
  renderDashboard();

  expect(
    screen.getByText("Take the Daily Check-up to start tracking your progress!")
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Go to Daily Check-up" })).toHaveAttribute(
    "href",
    "/daily-test"
  );
});

test("shows the chart instead of the empty state once history exists", () => {
  saveDailyTestResult({ completedAt: 1, totalQuestions: 10, correctCount: 8, topicStats: {} });

  renderDashboard();

  expect(
    screen.queryByText("Take the Daily Check-up to start tracking your progress!")
  ).not.toBeInTheDocument();
  expect(screen.getByRole("img", { name: "Daily Check-up score trend" })).toBeInTheDocument();
});

test("has a link back to Home", () => {
  renderDashboard();
  expect(screen.getByRole("link", { name: "Back to Word Explorer" })).toHaveAttribute("href", "/");
});
