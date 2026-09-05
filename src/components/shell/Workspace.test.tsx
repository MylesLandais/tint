import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceTabs, MetadataPanel, DetailSheet } from "./Workspace";
import { ResponsiveNavRail } from "./Shell";
describe("workspace primitives", () => {
  it("moves tab focus across enabled tabs while keeping panel state", () => {
    function Example() {
      const [value, setValue] = useState("one");
      return (
        <WorkspaceTabs
          label="Views"
          value={value}
          onChange={setValue}
          tabs={[
            {
              id: "one",
              label: "One",
              content: <input aria-label="Draft" defaultValue="saved" />,
            },
            {
              id: "disabled",
              label: "Disabled",
              disabled: true,
              content: null,
            },
            { id: "two", label: "Two", content: "Second panel" },
          ]}
        />
      );
    }
    render(<Example />);
    screen.getByRole("tab", { name: "One" }).focus();
    fireEvent.keyDown(document.activeElement!, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Second panel");
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(screen.getByLabelText("Draft")).toHaveValue("saved");
  });
  it("contains focus, preserves input focus across rerenders, and restores its trigger", () => {
    function Example() {
      const [open, setOpen] = useState(false),
        [value, setValue] = useState("");
      return (
        <>
          <button onClick={() => setOpen(true)}>Inspect</button>
          <DetailSheet
            open={open}
            onOpenChange={(value) => setOpen(value)}
            title="Details"
          >
            <input
              aria-label="Name"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
            <button>Last</button>
          </DetailSheet>
        </>
      );
    }
    render(<Example />);
    const trigger = screen.getByRole("button", { name: "Inspect" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    const input = screen.getByLabelText("Name");
    input.focus();
    fireEvent.change(input, { target: { value: "hello" } });
    expect(input).toHaveFocus();
    screen.getByRole("button", { name: "Last" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it("renders caller-supplied metadata", () => {
    render(
      <MetadataPanel
        title="Example"
        fields={[{ label: "Year", value: "2026" }]}
        tags={["Drama"]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Example" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2026")).toBeInTheDocument();
  });
  it("opens a focus-contained mobile navigation drawer", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <ResponsiveNavRail
          groups={[
            {
              id: "main",
              items: [{ id: "home", label: "Home", href: "#home" }],
            },
          ]}
          mobileOpen={open}
          onMobileOpenChange={setOpen}
        />
      );
    }
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(
      screen.getByRole("dialog", { name: "Navigation" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
