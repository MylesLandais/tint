import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorkspaceLayout, workspaceBodyColumns } from "./WorkspaceLayout";

describe("WorkspaceLayout", () => {
  it("renders the default extensible workspace regions", () => {
    render(
      <WorkspaceLayout
        navigation={<nav>Sources</nav>}
        toolbar={<button>Connect</button>}
        primary={<section>Viewport</section>}
        inspector={<aside>Inspector</aside>}
        drawer={<section>Terminal</section>}
      />,
    );

    const layout = screen.getByTestId("workspace-layout");
    expect(layout).toHaveAttribute("data-theme", "default");
    expect(screen.getByTestId("workspace-layout-navigation")).toHaveTextContent("Sources");
    expect(screen.getByTestId("workspace-layout-primary")).toHaveTextContent("Viewport");
    expect(screen.getByTestId("workspace-layout-inspector")).toHaveTextContent("Inspector");
    expect(screen.getByTestId("workspace-layout-drawer")).toHaveTextContent("Terminal");
  });

  it("supports named themes and overlay drawers without changing region content", () => {
    render(
      <WorkspaceLayout
        theme="pokeforce"
        drawerMode="overlay"
        primary={<section>Game</section>}
        drawer={<section>Debugger</section>}
      />,
    );

    expect(screen.getByTestId("workspace-layout")).toHaveAttribute("data-theme", "pokeforce");
    expect(screen.getByTestId("workspace-layout-drawer")).toHaveAttribute("data-drawer-mode", "overlay");
    expect(screen.getByText("Debugger")).toBeInTheDocument();
  });

  it("splits at every width when asked, and keeps the drawer overlay independent", () => {
    render(
      <WorkspaceLayout
        split="always"
        navigation={<nav>Sources</nav>}
        primary={<section>Viewport</section>}
        inspector={<aside>Inspector</aside>}
      />,
    );

    const body = screen.getByTestId("workspace-layout-navigation").parentElement;
    expect(body?.className).toContain(
      "grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)_var(--workspace-inspector-width)]",
    );
    // The container-query variant must be absent, not merely overridden: a host
    // relying on `always` has no second breakpoint to fight.
    expect(body?.className).not.toContain("@4xl/workspace:grid-cols-");
  });
});

describe("workspaceBodyColumns", () => {
  const regions = [
    { navigation: true, inspector: true },
    { navigation: true, inspector: false },
    { navigation: false, inspector: true },
    { navigation: false, inspector: false },
  ] as const;

  it("returns no column template when neither side region is present", () => {
    expect(workspaceBodyColumns({ navigation: false, inspector: false, split: "container" })).toBeUndefined();
    expect(workspaceBodyColumns({ navigation: false, inspector: false, split: "always" })).toBeUndefined();
  });

  it("gates every template behind the container query by default", () => {
    // This is the non-breaking proof: `container` must reproduce the exact
    // strings the component shipped before `split` existed.
    expect(workspaceBodyColumns({ navigation: true, inspector: true, split: "container" })).toBe(
      "@4xl/workspace:grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)_var(--workspace-inspector-width)]",
    );
    expect(workspaceBodyColumns({ navigation: true, inspector: false, split: "container" })).toBe(
      "@4xl/workspace:grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)]",
    );
    expect(workspaceBodyColumns({ navigation: false, inspector: true, split: "container" })).toBe(
      "@4xl/workspace:grid-cols-[minmax(0,1fr)_var(--workspace-inspector-width)]",
    );
  });

  it("drops the container gate for every region combination when splitting always", () => {
    for (const region of regions) {
      const always = workspaceBodyColumns({ ...region, split: "always" });
      const container = workspaceBodyColumns({ ...region, split: "container" });
      if (container === undefined) {
        expect(always).toBeUndefined();
        continue;
      }
      expect(always).toBe(container.replace("@4xl/workspace:", ""));
      expect(always).not.toContain("@4xl");
    }
  });

  it("names the navigation column before the inspector column", () => {
    const both = workspaceBodyColumns({ navigation: true, inspector: true, split: "always" })!;
    expect(both.indexOf("--workspace-navigation-width")).toBeLessThan(
      both.indexOf("--workspace-inspector-width"),
    );
  });

  it("only ever emits static class strings Tailwind can scan", () => {
    for (const region of regions) {
      for (const split of ["container", "always"] as const) {
        const value = workspaceBodyColumns({ ...region, split });
        if (value === undefined) continue;
        expect(value).not.toMatch(/\$\{|undefined|NaN/);
        expect(value.trim()).toBe(value);
      }
    }
  });
});

it("converts numeric region dimensions to CSS lengths", () => {
  render(<WorkspaceLayout primary="Game" navigationWidth={250} inspectorWidth={420} drawerHeight={240}/>);
  const style=screen.getByTestId("workspace-layout").style;
  expect(style.getPropertyValue("--workspace-navigation-width")).toBe("250px");
  expect(style.getPropertyValue("--workspace-inspector-width")).toBe("420px");
  expect(style.getPropertyValue("--workspace-drawer-height")).toBe("240px");
});
