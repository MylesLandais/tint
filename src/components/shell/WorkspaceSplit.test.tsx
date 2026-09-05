import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkspaceSplit, type WorkspaceSplitProps } from "./WorkspaceSplit";

function Example(props: Partial<WorkspaceSplitProps>) {
  const [size, setSize] = useState(200);
  return <WorkspaceSplit size={size} onSizeChange={setSize} minSize={100} maxSize={300}
    label="Resize tools" first={<input aria-label="Draft" defaultValue="unsaved" />}
    second="Canvas" {...props} />;
}

afterEach(() => vi.unstubAllGlobals());

describe("WorkspaceSplit", () => {
  it("supports keyboard resizing, bounds and controlled restore without losing pane drafts", () => {
    const { rerender } = render(<Example />);
    const splitter = screen.getByRole("separator", { name: "Resize tools" });
    fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "edited" } });
    fireEvent.keyDown(splitter, { key: "ArrowRight" });
    expect(splitter).toHaveAttribute("aria-valuenow", "210");
    fireEvent.keyDown(splitter, { key: "ArrowLeft", shiftKey: true });
    expect(splitter).toHaveAttribute("aria-valuenow", "160");
    fireEvent.keyDown(splitter, { key: "Home" });
    fireEvent.keyDown(splitter, { key: "ArrowLeft" });
    expect(splitter).toHaveAttribute("aria-valuenow", "100");
    fireEvent.keyDown(splitter, { key: "End" });
    expect(splitter).toHaveAttribute("aria-valuenow", "300");
    rerender(<Example size={175} />);
    expect(splitter).toHaveAttribute("aria-valuenow", "175");
    expect(screen.getByLabelText("Draft")).toHaveValue("edited");
    expect(document.getElementById(splitter.getAttribute("aria-controls")!)).toContainElement(screen.getByLabelText("Draft"));
  });

  it("grows a bottom or right pane toward the start and ignores orthogonal keys", () => {
    const { rerender } = render(<Example primary="second" direction="vertical" />);
    const splitter = screen.getByRole("separator");
    expect(splitter).toHaveAttribute("aria-orientation", "horizontal");
    fireEvent.keyDown(splitter, { key: "ArrowUp" });
    fireEvent.keyDown(splitter, { key: "ArrowLeft" });
    expect(splitter).toHaveAttribute("aria-valuenow", "210");
    rerender(<Example primary="second" />);
    fireEvent.keyDown(splitter, { key: "ArrowLeft" });
    expect(splitter).toHaveAttribute("aria-valuenow", "220");
  });

  it("captures one pointer, clamps movement, and stops on cancellation or lost capture", () => {
    class Pointer extends MouseEvent {
      pointerId: number;
      constructor(type: string, init: PointerEventInit) { super(type, init); this.pointerId = init.pointerId ?? 1; }
    }
    vi.stubGlobal("PointerEvent", Pointer);
    render(<Example primary="second" direction="vertical" />);
    const splitter = screen.getByRole("separator");
    splitter.setPointerCapture = vi.fn();
    splitter.releasePointerCapture = vi.fn();
    fireEvent.pointerDown(splitter, { button: 2, clientY: 100, pointerId: 1 });
    expect(splitter.setPointerCapture).not.toHaveBeenCalled();
    fireEvent.pointerDown(splitter, { button: 0, clientY: 100, pointerId: 1 });
    expect(splitter.setPointerCapture).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(splitter, { clientY: 80, pointerId: 2 });
    expect(splitter).toHaveAttribute("aria-valuenow", "200");
    fireEvent.pointerMove(splitter, { clientY: 80, pointerId: 1 });
    expect(splitter).toHaveAttribute("aria-valuenow", "220");
    fireEvent.pointerMove(splitter, { clientY: -200, pointerId: 1 });
    expect(splitter).toHaveAttribute("aria-valuenow", "300");
    fireEvent.pointerCancel(splitter, { pointerId: 1 });
    fireEvent.pointerMove(splitter, { clientY: 100, pointerId: 1 });
    expect(splitter).toHaveAttribute("aria-valuenow", "300");
    fireEvent.pointerDown(splitter, { button: 0, clientY: 100, pointerId: 1 });
    fireEvent.lostPointerCapture(splitter, { pointerId: 1 });
    fireEvent.pointerMove(splitter, { clientY: 200, pointerId: 1 });
    expect(splitter).toHaveAttribute("aria-valuenow", "300");
    fireEvent.pointerDown(splitter, { button: 0, clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(splitter, { pointerId: 1 });
    expect(splitter.releasePointerCapture).toHaveBeenCalledWith(1);
  });
});
