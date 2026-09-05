import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReleaseChart } from "tint/release-chart";

describe("ReleaseChart", () => {
  it("plots only supplied scores and exposes the exact data in an accessible table", () => {
    const rows = Object.freeze([
      { id: "small", size: 2.5, score: -12 },
      { id: "large", size: 18.4, score: 145.25 },
    ]);
    render(<ReleaseChart rows={rows} />);
    const chart = screen.getByRole("img", {
      name: "Release scores compared with file size",
    });
    const points = chart.querySelectorAll("circle");
    expect(points).toHaveLength(2);
    expect(Number(points[0].getAttribute("cx"))).toBeLessThan(
      Number(points[1].getAttribute("cx")),
    );
    expect(Number(points[0].getAttribute("cy"))).toBeGreaterThan(
      Number(points[1].getAttribute("cy")),
    );
    const table = screen.getByRole("table", { name: "Release score data" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Release", "Release size (GiB)", "Policy score"]);
    expect(
      within(table)
        .getAllByRole("row")
        .slice(1)
        .map((row) => row.textContent),
    ).toEqual(["small2.5-12", "large18.4145.25"]);
    expect(chart).toHaveTextContent("Release size (GiB)");
    expect(chart).toHaveTextContent("Policy score");
  });
  it("omits invalid rows from both the plot and table", () => {
    render(
      <ReleaseChart
        rows={[
          { id: "zero", size: 0, score: 0 },
          { id: "negative", size: -1, score: 1 },
          { id: "nan-size", size: NaN, score: 1 },
          { id: "infinite-size", size: Infinity, score: 1 },
          { id: "nan-score", size: 1, score: NaN },
          { id: "infinite-score", size: 1, score: -Infinity },
        ]}
      />,
    );
    expect(screen.getByRole("img").querySelectorAll("circle")).toHaveLength(1);
    expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
      2,
    );
    expect(screen.getByRole("table")).toHaveTextContent("zero");
    expect(screen.getByRole("table")).not.toHaveTextContent("negative");
  });

  it("clears stale points and explains when no valid data remains", () => {
    const { rerender } = render(
      <ReleaseChart rows={[{ id: "old", size: 1, score: 2 }]} />,
    );
    rerender(<ReleaseChart rows={[]} />);
    expect(
      screen.getByText("No valid release scores available."),
    ).toBeInTheDocument();
    expect(screen.queryByText("old")).not.toBeInTheDocument();
    expect(screen.getByRole("img").querySelectorAll("circle")).toHaveLength(0);
  });

  it("keeps extreme finite scores and sizes inside the plot", () => {
    render(
      <ReleaseChart
        rows={[
          { id: "low", size: 0, score: -Number.MAX_VALUE },
          { id: "high", size: Number.MAX_VALUE, score: Number.MAX_VALUE },
        ]}
      />,
    );
    const points = screen.getByRole("img").querySelectorAll("circle");
    for (const point of points) {
      expect(Number(point.getAttribute("cx"))).toBeGreaterThanOrEqual(80);
      expect(Number(point.getAttribute("cx"))).toBeLessThanOrEqual(610);
      expect(Number(point.getAttribute("cy"))).toBeGreaterThanOrEqual(24);
      expect(Number(point.getAttribute("cy"))).toBeLessThanOrEqual(220);
    }
    expect(Number(points[0].getAttribute("cy"))).toBeGreaterThan(
      Number(points[1].getAttribute("cy")),
    );
  });
});
