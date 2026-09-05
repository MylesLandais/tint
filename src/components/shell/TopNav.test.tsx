import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppShell, TopNav, type NavGroup } from "./index";

const groups: NavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "home", label: "Home", href: "/home", icon: <span>H</span> },
      { id: "files", label: "Files", href: "/files" },
    ],
  },
  {
    id: "system",
    items: [
      { id: "settings", label: "Settings", href: "/settings" },
      { id: "disabled", label: "Disabled", href: "/disabled", disabled: true },
    ],
  },
];

describe("TopNav", () => {
  it("renders items from groups with hrefs and marks the active item", () => {
    render(
      <TopNav
        aria-label="Primary"
        brand={<span>Acme</span>}
        groups={groups}
        activeId="home"
        actions={<button>Sign out</button>}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveAttribute(
      "data-tint-top-nav",
    );
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/home",
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Files" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "More" }),
    ).not.toBeInTheDocument();
  });

  it("reports href-aware navigation and blocks disabled items", () => {
    const navigate = vi.fn();
    render(<TopNav groups={groups} onNavigate={navigate} />);
    fireEvent.click(screen.getByRole("link", { name: "Files" }));
    expect(navigate).toHaveBeenCalledWith("files", "/files");
    const disabled = screen.getByRole("link", { name: "Disabled" });
    expect(disabled).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(disabled);
    expect(navigate).toHaveBeenCalledTimes(1);
  });

  it("collapses items beyond maxVisibleItems behind a More menu", () => {
    const navigate = vi.fn();
    render(
      <TopNav groups={groups} maxVisibleItems={2} onNavigate={navigate} />,
    );
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Files" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Settings" }),
    ).not.toBeInTheDocument();
    const more = screen.getByRole("button", { name: "More" });
    expect(more).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(more);
    expect(more).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    expect(navigate).toHaveBeenCalledWith("settings", "/settings");
    expect(more).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the More menu on Escape and outside click", () => {
    render(
      <TopNav groups={groups} maxVisibleItems={2} overflowLabel="Extra" />,
    );
    const more = screen.getByRole("button", { name: "Extra" });
    fireEvent.click(more);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(more);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("places the nav slot above the header in AppShell top mode", () => {
    render(
      <AppShell
        navPosition="top"
        nav={<span>nav</span>}
        header={<span>head</span>}
      >
        <p>work</p>
      </AppShell>,
    );
    const layout = screen.getByTestId("app-shell-layout");
    expect(layout).toHaveAttribute("data-nav-position", "top");
    const nav = screen.getByTestId("app-shell-nav");
    const header = screen.getByTestId("app-shell-header");
    expect(
      nav.compareDocumentPosition(header) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("defaults AppShell to rail mode", () => {
    render(
      <AppShell nav={<span>nav</span>}>
        <p>work</p>
      </AppShell>,
    );
    expect(screen.getByTestId("app-shell-layout")).toHaveAttribute(
      "data-nav-position",
      "rail",
    );
  });
});
