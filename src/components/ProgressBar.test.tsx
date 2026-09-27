import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "./ProgressBar";

test("reflects current progress as a percentage", () => {
  render(<ProgressBar current={3} total={10} />);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "30");
});

test("shows 0% when there are no words", () => {
  render(<ProgressBar current={0} total={0} />);
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
});
