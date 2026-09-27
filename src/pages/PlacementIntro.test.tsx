import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import PlacementIntro from "./PlacementIntro";
import type { PlacementQuestion } from "../types";

function QuizProbe() {
  const location = useLocation();
  const state = location.state as { questions?: PlacementQuestion[] } | null;
  return <div>Quiz reached with {state?.questions?.length ?? 0} questions</div>;
}

test("shows an explanation and starting the test navigates to the quiz with 30 questions", async () => {
  const user = userEvent.setup();

  render(
    <MemoryRouter initialEntries={["/placement-test"]}>
      <Routes>
        <Route path="/placement-test" element={<PlacementIntro />} />
        <Route path="/placement-test/quiz" element={<QuizProbe />} />
      </Routes>
    </MemoryRouter>
  );

  expect(screen.getByText("Placement Test 📝")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Start Test" }));

  expect(screen.getByText("Quiz reached with 30 questions")).toBeInTheDocument();
});
