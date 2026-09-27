import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders the Home screen at the root route", () => {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Word Explorer 🚀")).toBeInTheDocument();
});

test("renders the Topic screen at /topic/:topicId", () => {
  render(
    <MemoryRouter initialEntries={["/topic/animals"]}>
      <App />
    </MemoryRouter>
  );

  expect(screen.getByText("Animals")).toBeInTheDocument();
});
