import { expect, test } from "vitest";
import { render } from "@testing-library/react";
import ScoreTrendChart from "./ScoreTrendChart";

test("renders a marker for every data point", () => {
  const { container } = render(
    <ScoreTrendChart
      data={[
        { completedAt: 1, percentage: 50 },
        { completedAt: 2, percentage: 80 },
      ]}
    />
  );

  expect(container.querySelectorAll("circle")).toHaveLength(2);
});

test("renders a connecting line when there is more than one point", () => {
  const { container } = render(
    <ScoreTrendChart
      data={[
        { completedAt: 1, percentage: 50 },
        { completedAt: 2, percentage: 80 },
      ]}
    />
  );

  expect(container.querySelector("polyline")).not.toBeNull();
});

test("renders only a single marker and no line for one data point", () => {
  const { container } = render(<ScoreTrendChart data={[{ completedAt: 1, percentage: 60 }]} />);

  expect(container.querySelectorAll("circle")).toHaveLength(1);
  expect(container.querySelector("polyline")).toBeNull();
});

test("labels only the most recent point's percentage", () => {
  const { getByText, queryByText } = render(
    <ScoreTrendChart
      data={[
        { completedAt: 1, percentage: 50 },
        { completedAt: 2, percentage: 80 },
      ]}
    />
  );

  expect(getByText("80%")).toBeInTheDocument();
  expect(queryByText("50%")).not.toBeInTheDocument();
});
