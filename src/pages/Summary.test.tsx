import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Summary from "./Summary";

function SessionProbe() {
  const location = useLocation();
  const state = location.state as { wordIds?: string[] } | null;
  return <div>Session reached with wordIds: {state?.wordIds?.join(",")}</div>;
}

function renderAt(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path="/topic/:topicId/summary" element={<Summary />} />
        <Route path="/topic/:topicId/session" element={<SessionProbe />} />
        <Route path="/topic/:topicId" element={<div>Topic Screen</div>} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

test("shows counts of known vs still-learning words", () => {
  renderAt("/topic/animals/summary", {
    results: [
      { wordId: "animals-dog", status: "known" },
      { wordId: "animals-cat", status: "learning" },
      { wordId: "animals-fish", status: "known" },
    ],
  });

  expect(screen.getByText("2 words you know! ✅")).toBeInTheDocument();
  expect(screen.getByText("1 words still learning 🌱")).toBeInTheDocument();
});

test("Review again navigates to session with only still-learning word ids", async () => {
  const user = userEvent.setup();
  renderAt("/topic/animals/summary", {
    results: [
      { wordId: "animals-dog", status: "known" },
      { wordId: "animals-cat", status: "learning" },
    ],
  });

  await user.click(screen.getByRole("button", { name: /Review again/ }));

  expect(screen.getByText("Session reached with wordIds: animals-cat")).toBeInTheDocument();
});

test("hides Review again when every word is known", () => {
  renderAt("/topic/animals/summary", {
    results: [{ wordId: "animals-dog", status: "known" }],
  });

  expect(screen.queryByRole("button", { name: /Review again/ })).not.toBeInTheDocument();
});

test("redirects to the topic screen when there are no results in state", () => {
  renderAt("/topic/animals/summary");
  expect(screen.getByText("Topic Screen")).toBeInTheDocument();
});
