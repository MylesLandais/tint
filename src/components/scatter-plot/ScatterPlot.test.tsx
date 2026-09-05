import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScatterPlot } from "./ScatterPlot";
describe("ScatterPlot", () => {
  it("exposes selection through the data table with stable IDs for duplicate labels", () => {
    const onSelect = vi.fn();
    render(
      <ScatterPlot
        rows={[
          { id: "one", label: "Same", x: -2, y: 0 },
          { id: "two", label: "Same", x: 4, y: -10 },
        ]}
        label="Comparison"
        xLabel="Cost"
        yLabel="Benefit"
        onSelect={onSelect}
        selectedId="two"
      />,
    );
    const buttons = screen.getAllByRole("button", { name: "Same" });
    fireEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledWith("one");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    for (const circle of screen.getByRole("img").querySelectorAll("circle")) {
      expect(Number(circle.getAttribute("cx"))).toBeGreaterThanOrEqual(80);
      expect(Number(circle.getAttribute("cy"))).toBeLessThanOrEqual(220);
    }
  });
});
