import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopicTile from "./TopicTile";
import type { Topic } from "../types";

const topic: Topic = { id: "animals", name: "Animals", emoji: "🐶", colorClass: "bg-amber-400" };

test("renders the topic name, emoji, and links to the topic route", () => {
  render(
    <MemoryRouter>
      <TopicTile topic={topic} />
    </MemoryRouter>
  );

  expect(screen.getByText("Animals")).toBeInTheDocument();
  expect(screen.getByText("🐶")).toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute("href", "/topic/animals");
});
