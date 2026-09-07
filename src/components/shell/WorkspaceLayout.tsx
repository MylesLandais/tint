import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export type WorkspaceLayoutTheme = "default" | (string & {});
export type WorkspaceDrawerMode = "inline" | "overlay";
/**
 * When the side regions become columns.
 *
 * `"container"` keeps the historical behaviour: single column until the
 * `@4xl/workspace` container breakpoint (896px). `"always"` splits at every
 * width and lets the host own the narrow case itself.
 *
 * The distinction matters for a workspace nested inside other chrome. A host
 * whose own rail eats 56–240px hits the breakpoint at a viewport width far
 * wider than 896px, so `"container"` leaves it single-column while it has
 * ample room. Before this prop such a host could only fix it by redefining
 * `[data-tint-workspace-body]`'s grid from outside — overriding internals that
 * nothing here promises to keep stable.
 */
export type WorkspaceSplitMode = "container" | "always";

/**
 * The body's grid-column classes.
 *
 * Exported because it is the whole layout decision and worth testing without a
 * DOM. Every branch returns a *static* string: Tailwind scans source text, so a
 * composed or interpolated class name would not survive the build.
 */
export function workspaceBodyColumns({
  navigation,
  inspector,
  split,
}: {
  navigation: boolean;
  inspector: boolean;
  split: WorkspaceSplitMode;
}): string | undefined {
  if (navigation && inspector)
    return split === "always"
      ? "grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)_var(--workspace-inspector-width)]"
      : "@4xl/workspace:grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)_var(--workspace-inspector-width)]";
  if (navigation)
    return split === "always"
      ? "grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)]"
      : "@4xl/workspace:grid-cols-[var(--workspace-navigation-width)_minmax(0,1fr)]";
  if (inspector)
    return split === "always"
      ? "grid-cols-[minmax(0,1fr)_var(--workspace-inspector-width)]"
      : "@4xl/workspace:grid-cols-[minmax(0,1fr)_var(--workspace-inspector-width)]";
  return undefined;
}

export type WorkspaceLayoutProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  theme?: WorkspaceLayoutTheme;
  navigation?: ReactNode;
  toolbar?: ReactNode;
  primary: ReactNode;
  inspector?: ReactNode;
  drawer?: ReactNode;
  drawerMode?: WorkspaceDrawerMode;
  split?: WorkspaceSplitMode;
  navigationWidth?: CSSProperties["width"];
  inspectorWidth?: CSSProperties["width"];
  drawerHeight?: CSSProperties["height"];
};

/**
 * A domain-neutral workspace frame. Applications own every region's content,
 * state, persistence, and transport; Tint owns only responsive composition.
 */
export function WorkspaceLayout({
  theme = "default",
  navigation,
  toolbar,
  primary,
  inspector,
  drawer,
  drawerMode = "inline",
  split = "container",
  navigationWidth = "16rem",
  inspectorWidth = "20rem",
  drawerHeight = "16rem",
  className,
  style,
  ...props
}: WorkspaceLayoutProps) {
  const length = (value: CSSProperties["width"]) => typeof value === "number" ? `${value}px` : value;
  const variables = {
    "--workspace-navigation-width": length(navigationWidth),
    "--workspace-inspector-width": length(inspectorWidth),
    "--workspace-drawer-height": length(drawerHeight),
  } as CSSProperties;

  return (
    <div
      data-testid="workspace-layout"
      data-tint-workspace-layout
      data-theme={theme}
      className={cn(
        "@container/workspace relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-tint-surface text-tint-ink",
        className,
      )}
      style={{ ...variables, ...style, containerType: "inline-size" }}
      {...props}
    >
      {toolbar ? (
        <div
          data-testid="workspace-layout-toolbar"
          data-tint-workspace-toolbar
          className="col-span-full min-w-0 border-b border-tint-border bg-tint-panel"
        >
          {toolbar}
        </div>
      ) : null}
      <div
        data-tint-workspace-body
        className={cn(
          "grid min-h-0 min-w-0 flex-1 grid-cols-1 overflow-auto @4xl/workspace:overflow-hidden",
          split === "always" && "overflow-hidden",
          workspaceBodyColumns({
            navigation: Boolean(navigation),
            inspector: Boolean(inspector),
            split,
          }),
        )}
      >
        {navigation ? (
          <div
            data-testid="workspace-layout-navigation"
            data-tint-workspace-navigation
            className={cn(
              "min-h-0 min-w-0 overflow-auto border-tint-border bg-tint-panel",
              split === "always"
                ? "border-r"
                : "border-b @4xl/workspace:border-b-0 @4xl/workspace:border-r",
            )}
          >
            {navigation}
          </div>
        ) : null}
        <div
          data-testid="workspace-layout-primary"
          data-tint-workspace-primary
          className="min-h-0 min-w-0 overflow-auto"
        >
          {primary}
        </div>
        {inspector ? (
          <div
            data-testid="workspace-layout-inspector"
            data-tint-workspace-inspector
            className={cn(
              "min-h-0 min-w-0 overflow-auto border-tint-border bg-tint-panel",
              split === "always"
                ? "border-l"
                : "border-t @4xl/workspace:border-l @4xl/workspace:border-t-0",
            )}
          >
            {inspector}
          </div>
        ) : null}
      </div>
      {drawer ? (
        <div
          data-testid="workspace-layout-drawer"
          data-tint-workspace-drawer
          data-drawer-mode={drawerMode}
          className={cn(
            "col-span-full min-h-0 min-w-0 overflow-auto border-t border-tint-border bg-tint-panel",
            drawerMode === "inline" && "h-[var(--workspace-drawer-height)]",
            drawerMode === "overlay" && "absolute inset-x-0 bottom-0 z-20 h-[var(--workspace-drawer-height)] shadow-xl",
          )}
        >
          {drawer}
        </div>
      ) : null}
    </div>
  );
}
