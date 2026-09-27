import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { topics } from "../data/vocabulary";

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
