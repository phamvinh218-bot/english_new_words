import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TopicScreen from "./TopicScreen";
import { getWordsForTopic } from "../data/vocabulary";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/topic/:topicId" element={<TopicScreen />} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

test("shows the topic name and word count with a Start Learning link", () => {
  renderAt("/topic/animals");

  expect(screen.getByText("Animals")).toBeInTheDocument();
  const wordCount = getWordsForTopic("animals").length;
  expect(screen.getByText(`${wordCount} words to learn`)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Start Learning" })).toHaveAttribute(
    "href",
    "/topic/animals/session"
  );
});

test("redirects to Home for an unknown topic id", () => {
  renderAt("/topic/not-a-real-topic");
  expect(screen.getByText("Home Page")).toBeInTheDocument();
});
