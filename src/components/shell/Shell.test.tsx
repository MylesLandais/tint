import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  AppShell,
  CommandPalette,
  EmptyState,
  ErrorBanner,
  LoadingState,
  NavRail,
  StatusBar,
  WorkspaceHeader,
  type CommandPaletteItem,
  type NavGroup,
  type StatusItem,
} from "./index";

const groups: NavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "home", label: "Home", href: "/home", icon: <span>H</span> },
      { id: "files", label: "Files", href: "/files" },
    ],
  },
];
const commands: CommandPaletteItem[] = [
  {
    id: "open",
    label: "Open project",
    description: "Choose a workspace",
    group: "File",
  },
  {
    id: "settings",
    label: "Settings",
    keywords: ["preferences"],
    group: "View",
  },
];

describe("shell primitives", () => {
  it("exposes every app shell slot and container-query responsive tiers", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <AppShell
        ref={ref}
        nav={<span>nav</span>}
        header={<span>head</span>}
        aside={<span>aside</span>}
        status={<span>status</span>}
        data-host="yes"
      >
        <p>work</p>
      </AppShell>,
    );
    expect(ref.current).toHaveAttribute("data-host", "yes");
    expect(ref.current).toHaveClass("@container/app-shell");
    const layout = screen.getByTestId("app-shell-layout");
    expect(layout).toHaveClass("@3xl/app-shell:grid-cols-[auto_minmax(0,1fr)]");
    expect(layout).toHaveClass(
      "@6xl/app-shell:grid-cols-[auto_minmax(0,1fr)_minmax(16rem,24rem)]",
    );
    expect(screen.getByTestId("app-shell-nav")).toHaveTextContent("nav");
    expect(screen.getByTestId("app-shell-header")).toHaveTextContent("head");
    expect(screen.getByTestId("app-shell-aside")).toHaveTextContent("aside");
    expect(screen.getByTestId("app-shell-status")).toHaveTextContent("status");
    expect(screen.getByRole("main")).toHaveTextContent("work");
  });

  it("renders grouped anchor navigation and reports href-aware navigation", () => {
    const navigate = vi.fn();
    render(
      <NavRail
        aria-label="Primary"
        groups={groups}
        activeId="home"
        onNavigate={navigate}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/home",
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByTestId("nav-rail-groups")).toHaveClass(
      "overflow-y-auto",
    );
    fireEvent.click(screen.getByRole("link", { name: "Files" }));
    expect(navigate).toHaveBeenCalledWith("files", "/files");
  });

  it("keeps nav collapse controlled", () => {
    const change = vi.fn();
    render(
      <NavRail
        aria-label="Primary"
        groups={groups}
        collapsed={false}
        onCollapsedChange={change}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Collapse navigation" }),
    );
    expect(change).toHaveBeenCalledWith(true);
  });

  it("renders breadcrumbs, title, subtitle, and actions", () => {
    render(
      <WorkspaceHeader
        breadcrumbs={[
          { label: "Projects", href: "/projects" },
          { label: "Atlas" },
        ]}
        title="Atlas"
        subtitle="Research"
        actions={<button>Share</button>}
      />,
    );
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toHaveTextContent("Projects");
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    expect(screen.getByRole("heading", { name: "Atlas" })).toBeInTheDocument();
    expect(screen.getByText("Research")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  it("filters and keyboard-selects a controlled command palette", () => {
    const change = vi.fn();
    const select = vi.fn();
    const openChange = vi.fn();
    const { rerender } = render(
      <CommandPalette
        open
        query=""
        onQueryChange={change}
        onOpenChange={openChange}
        items={commands}
        onSelect={select}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "preferences" },
    });
    expect(change).toHaveBeenCalledWith("preferences");
    rerender(
      <CommandPalette
        open
        query="preferences"
        onQueryChange={change}
        onOpenChange={openChange}
        items={commands}
        onSelect={select}
      />,
    );
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(select).toHaveBeenCalledWith("settings");
    expect(openChange).toHaveBeenCalledWith(false);
  });

  it("renders typed status items and connection state", () => {
    const items: StatusItem[] = [
      { id: "saved", label: "Saved", tone: "success" },
    ];
    render(
      <StatusBar
        items={items}
        connection={{ state: "connected", label: "Online" }}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(screen.getByText("Saved").closest("[data-tone]")).toHaveAttribute(
      "data-tone",
      "success",
    );
    expect(screen.getByText("Online")).toHaveAttribute(
      "data-connection-state",
      "connected",
    );
  });

  it("supports dismissible errors with actions and expandable diagnostics", () => {
    const dismiss = vi.fn();
    render(
      <ErrorBanner
        title="Could not save"
        detail="Retry later"
        actions={<button>Retry</button>}
        diagnostics="stack trace"
        onDismiss={dismiss}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Retry later");
    fireEvent.click(screen.getByText("Diagnostics"));
    expect(screen.getByText("stack trace")).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it("provides generic empty and loading states", () => {
    render(
      <>
        <EmptyState
          title="No projects"
          description="Create one"
          actions={<button>Create</button>}
        />
        <LoadingState label="Loading projects" description="Please wait" />
      </>,
    );
    expect(screen.getByText("No projects")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByLabelText("Loading projects")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByText("Please wait")).toBeInTheDocument();
  });
});
