import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import DailyTestIntro from "./DailyTestIntro";
import { recordProgress } from "../lib/progress";
import type { PlacementQuestion } from "../types";

function QuizProbe() {
  const location = useLocation();
  const state = location.state as { questions?: PlacementQuestion[] } | null;
  return <div>Quiz reached with {state?.questions?.length ?? 0} questions</div>;
}

function renderAt() {
  return render(
    <MemoryRouter initialEntries={["/daily-test"]}>
      <Routes>
        <Route path="/daily-test" element={<DailyTestIntro />} />
        <Route path="/daily-test/quiz" element={<QuizProbe />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

test("shows an empty-state message with no Start button when nothing has been learned yet", () => {
  renderAt();

  expect(
    screen.getByText("Learn some words first, then come back to check up!")
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Start Test" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Back to Word Explorer" })).toHaveAttribute("href", "/");
});

test("starting the test navigates to the quiz with questions once words have been learned", async () => {
  recordProgress("animals-dog", "known");
  recordProgress("colors-red", "learning");

  const user = userEvent.setup();
  renderAt();

  await user.click(screen.getByRole("button", { name: "Start Test" }));

  expect(screen.getByText("Quiz reached with 2 questions")).toBeInTheDocument();
});
