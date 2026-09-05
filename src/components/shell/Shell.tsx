import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Dialog } from "../dialog";
import { Badge, type BadgeTone } from "../badge";
import { Icon, Spinner } from "../icon";

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  nav?: ReactNode;
  navPosition?: "rail" | "top";
  header?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  status?: ReactNode;
};

export function AppShell({
  ref,
  nav,
  navPosition = "rail",
  header,
  aside,
  status,
  children,
  className,
  ...props
}: AppShellProps) {
  const top = navPosition === "top";
  return (
    <div
      ref={ref}
      data-tint-app-shell
      className={cn(
        "@container/app-shell min-h-dvh bg-tint-surface text-tint-ink",
        className,
      )}
      {...props}
    >
      <div
        data-testid="app-shell-layout"
        data-tint-app-shell-layout
        data-nav-position={navPosition}
        className={cn(
          top
            ? "grid min-h-dvh grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] @3xl/app-shell:h-dvh @3xl/app-shell:overflow-hidden @6xl/app-shell:grid-cols-[minmax(0,1fr)_minmax(16rem,24rem)]"
            : "grid min-h-dvh grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] @3xl/app-shell:h-dvh @3xl/app-shell:overflow-hidden @3xl/app-shell:grid-cols-[auto_minmax(0,1fr)] @3xl/app-shell:grid-rows-[auto_minmax(0,1fr)_auto] @6xl/app-shell:grid-cols-[auto_minmax(0,1fr)_minmax(16rem,24rem)]",
          !aside &&
            (top
              ? "@6xl/app-shell:grid-cols-1"
              : "@6xl/app-shell:grid-cols-[auto_minmax(0,1fr)]"),
        )}
      >
        {nav ? (
          <div
            data-testid="app-shell-nav"
            data-tint-app-shell-nav
            className={
              top
                ? aside
                  ? "@6xl/app-shell:col-span-2"
                  : undefined
                : "@3xl/app-shell:row-start-1 @3xl/app-shell:col-start-1 @3xl/app-shell:row-span-3 @3xl/app-shell:min-h-0"
            }
          >
            {nav}
          </div>
        ) : null}
        {header ? (
          <div
            data-testid="app-shell-header"
            data-tint-app-shell-header
            className={
              top
                ? undefined
                : cn(
                    "@3xl/app-shell:row-start-1 @3xl/app-shell:col-start-2",
                    aside &&
                      "@6xl/app-shell:col-span-2 @6xl/app-shell:col-start-2",
                  )
            }
          >
            {header}
          </div>
        ) : null}
        <main
          data-tint-workspace
          className={
            top
              ? "min-w-0 overflow-auto"
              : "min-h-0 min-w-0 overflow-auto @3xl/app-shell:row-start-2 @3xl/app-shell:col-start-2"
          }
        >
          {children}
        </main>
        {aside ? (
          <aside
            data-testid="app-shell-aside"
            data-tint-app-shell-aside
            className={
              top
                ? "hidden min-w-0 overflow-auto border-l border-tint-border @6xl/app-shell:col-start-2 @6xl/app-shell:row-start-3 @6xl/app-shell:block"
                : "hidden min-w-0 overflow-auto border-l border-tint-border @6xl/app-shell:col-start-3 @6xl/app-shell:row-start-2 @6xl/app-shell:block"
            }
          >
            {aside}
          </aside>
        ) : null}
        {status ? (
          <div
            data-testid="app-shell-status"
            data-tint-app-shell-status
            className={
              top
                ? aside
                  ? "@6xl/app-shell:col-span-2"
                  : undefined
                : cn(
                    "@3xl/app-shell:row-start-3 @3xl/app-shell:col-start-2",
                    aside &&
                      "@6xl/app-shell:col-span-2 @6xl/app-shell:col-start-2",
                  )
            }
          >
            {status}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export type NavRailItem = {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
};
export type NavGroup = {
  id: string;
  label?: ReactNode;
  items: readonly NavRailItem[];
};
export type NavRailProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  groups: readonly NavGroup[];
  activeId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: (id: string, href: string) => void;
  header?: ReactNode;
  footer?: ReactNode;
};

export function NavRail({
  ref,
  groups,
  activeId,
  collapsed = false,
  onCollapsedChange,
  onNavigate,
  header,
  footer,
  className,
  ...props
}: NavRailProps) {
  return (
    <nav
      ref={ref}
      data-tint-nav-rail
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex h-full w-full flex-col border-r border-tint-border bg-tint-panel p-2 @3xl/app-shell:w-64",
        collapsed && "@3xl/app-shell:w-16",
        className,
      )}
      {...props}
    >
      {header}
      <div
        data-testid="nav-rail-groups"
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto"
      >
        {groups.map((group) => (
          <section
            key={group.id}
            role="group"
            aria-label={
              typeof group.label === "string" ? group.label : undefined
            }
            data-tint-nav-group
          >
            {group.label ? (
              <h2
                className={cn(
                  "mb-1 px-2 text-xs font-medium text-tint-muted",
                  collapsed && "sr-only",
                )}
              >
                {group.label}
              </h2>
            ) : null}
            <ul className="m-0 list-none space-y-1 p-0">
              {group.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    aria-current={item.id === activeId ? "page" : undefined}
                    aria-disabled={item.disabled || undefined}
                    onClick={(event) => {
                      if (item.disabled) event.preventDefault();
                      else onNavigate?.(item.id, item.href);
                    }}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-tint-muted hover:bg-tint-surface hover:text-tint-ink",
                      collapsed && "justify-center px-0",
                      item.id === activeId &&
                        "bg-tint-accent-soft text-tint-accent",
                      item.disabled && "pointer-events-none opacity-50",
                    )}
                  >
                    <span aria-hidden="true">
                      {item.icon ?? (
                        <span className="text-xs font-semibold">
                          {item.label.slice(0, 2)}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        collapsed && "sr-only",
                      )}
                    >
                      {item.label}
                    </span>
                    {!collapsed ? item.badge : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {footer}
      {onCollapsedChange ? (
        <button
          type="button"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          aria-expanded={!collapsed}
          onClick={() => onCollapsedChange(!collapsed)}
          className="mt-2 flex min-h-9 items-center justify-center rounded-lg text-tint-muted hover:bg-tint-surface hover:text-tint-ink"
        >
          <Icon icon={collapsed ? ChevronRight : ChevronLeft} size="sm" />
        </button>
      ) : null}
    </nav>
  );
}

export type WorkspaceBreadcrumb = { label: ReactNode; href?: string };
export type WorkspaceHeaderProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  breadcrumbs?: readonly WorkspaceBreadcrumb[];
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
};
export function WorkspaceHeader({
  ref,
  breadcrumbs,
  title,
  subtitle,
  actions,
  children,
  className,
  ...props
}: WorkspaceHeaderProps) {
  return (
    <header
      ref={ref}
      data-tint-workspace-header
      className={cn(
        "flex min-h-16 flex-wrap items-center gap-3 border-b border-tint-border bg-tint-panel px-4 py-2",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb">
            <ol className="m-0 flex list-none items-center gap-1 p-0 text-xs text-tint-muted">
              {breadcrumbs.map((item, index) => (
                <li key={index} className="flex items-center gap-1">
                  {index ? <span aria-hidden="true">/</span> : null}
                  {item.href ? (
                    <a href={item.href} className="hover:text-tint-ink">
                      {item.label}
                    </a>
                  ) : (
                    <span aria-current="page">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <h1 className="m-0 truncate text-base font-semibold">{title}</h1>
        {subtitle ? (
          <p className="m-0 truncate text-xs text-tint-muted">{subtitle}</p>
        ) : null}
      </div>
      {children}
      <div className="flex items-center gap-2">{actions}</div>
    </header>
  );
}

export type CommandPaletteItem = {
  id: string;
  label: string;
  description?: string;
  keywords?: readonly string[];
  group?: string;
  shortcut?: string;
  disabled?: boolean;
};
export type CommandPaletteProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onSelect"
> & {
  ref?: Ref<HTMLDivElement>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  items: readonly CommandPaletteItem[];
  onSelect?: (id: string) => void;
  label?: string;
  placeholder?: string;
  emptyText?: ReactNode;
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange"
  >;
};
export function CommandPalette({
  ref,
  open,
  onOpenChange,
  query,
  onQueryChange,
  items,
  onSelect,
  label = "Command palette",
  placeholder = "Type a command…",
  emptyText = "No commands found.",
  inputProps,
  className,
  ...props
}: CommandPaletteProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(0);
  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return items.filter((item) =>
      tokens.every((token) =>
        `${item.label} ${item.description ?? ""} ${item.keywords?.join(" ") ?? ""} ${item.group ?? ""}`
          .toLowerCase()
          .includes(token),
      ),
    );
  }, [items, query]);
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);
  if (!open) return null;
  const choose = (item: CommandPaletteItem) => {
    if (item.disabled) return;
    onSelect?.(item.id);
    onOpenChange(false);
  };
  return (
    <div
      ref={ref}
      data-tint-command-palette
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]",
        className,
      )}
      {...props}
    >
      <div
        data-tint-command-palette-backdrop
        className="absolute inset-0 bg-tint-ink/30"
        aria-hidden="true"
        onMouseDown={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-tint-border bg-tint-panel shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-tint-border px-4 py-3">
          <Icon icon={Search} className="text-tint-muted" />
          <input
            {...inputProps}
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={
              filtered[active] ? `${listId}-${filtered[active].id}` : undefined
            }
            value={query}
            onChange={(e) => {
              setActive(0);
              onQueryChange(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onOpenChange(false);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) =>
                  filtered.length ? (i + 1) % filtered.length : 0,
                );
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) =>
                  filtered.length
                    ? (i - 1 + filtered.length) % filtered.length
                    : 0,
                );
              } else if (e.key === "Enter" && filtered[active]) {
                e.preventDefault();
                choose(filtered[active]);
              }
            }}
            placeholder={placeholder}
            className={cn(
              "w-full bg-transparent text-sm outline-none placeholder:text-tint-muted",
              inputProps?.className,
            )}
          />
        </div>
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          className="max-h-80 overflow-auto p-2"
        >
          {filtered.length ? (
            filtered.map((item, index) => (
              <button
                key={item.id}
                id={`${listId}-${item.id}`}
                type="button"
                role="option"
                aria-selected={index === active}
                disabled={item.disabled}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-tint-surface",
                  index === active && "bg-tint-accent-soft",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {item.label}
                  </span>
                  {item.description ? (
                    <span className="block truncate text-xs text-tint-muted">
                      {item.description}
                    </span>
                  ) : null}
                </span>
                {item.shortcut ? (
                  <kbd className="text-xs text-tint-muted">{item.shortcut}</kbd>
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-sm text-tint-muted">
              {emptyText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type StatusItem = {
  id: string;
  label: ReactNode;
  tone?: BadgeTone;
  icon?: ReactNode;
};
export type ConnectionStateValue =
  "connected" | "connecting" | "disconnected" | "error";
export type ConnectionState = { state: ConnectionStateValue; label: ReactNode };
export type StatusBarProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  items?: readonly StatusItem[];
  connection?: ConnectionState;
};
export function StatusBar({
  ref,
  items,
  connection,
  children,
  className,
  ...props
}: StatusBarProps) {
  return (
    <footer
      ref={ref}
      role="status"
      data-tint-status-bar
      className={cn(
        "flex min-h-7 items-center gap-2 border-t border-tint-border bg-tint-panel px-3 text-xs text-tint-muted",
        className,
      )}
      {...props}
    >
      {items?.map((item) => (
        <Badge key={item.id} tone={item.tone} leading={item.icon}>
          {item.label}
        </Badge>
      ))}
      {children}
      {connection ? (
        <span data-connection-state={connection.state} className="ml-auto">
          {connection.label}
        </span>
      ) : null}
    </footer>
  );
}

export type ErrorBannerProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  title: ReactNode;
  detail?: ReactNode;
  actions?: ReactNode;
  diagnostics?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
};
export function ErrorBanner({
  ref,
  title,
  detail,
  actions,
  diagnostics,
  onDismiss,
  dismissLabel = "Dismiss",
  children,
  className,
  ...props
}: ErrorBannerProps) {
  return (
    <div
      ref={ref}
      role="alert"
      data-tint-error-banner
      className={cn(
        "flex items-start gap-3 border border-tint-danger/40 bg-tint-danger-soft p-3 text-sm",
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <strong className="block">{title}</strong>
        {detail ? <div className="text-tint-muted">{detail}</div> : null}
        {children}
        {diagnostics ? (
          <details className="mt-2">
            <summary className="cursor-pointer font-medium">
              Diagnostics
            </summary>
            <pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs">
              {diagnostics}
            </pre>
          </details>
        ) : null}
        <div className="mt-2 flex gap-2">{actions}</div>
      </div>
      {onDismiss ? (
        <button type="button" aria-label={dismissLabel} onClick={onDismiss}>
          <Icon icon={X} size="sm" />
        </button>
      ) : null}
    </div>
  );
}

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  action?: ReactNode;
};
export function EmptyState({
  ref,
  title,
  description,
  icon,
  actions,
  action,
  children,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      ref={ref}
      data-tint-empty-state
      className={cn("grid place-items-center gap-2 p-8 text-center", className)}
      {...props}
    >
      {icon}
      <h2 className="m-0 text-base font-semibold">{title}</h2>
      {description ? (
        <p className="m-0 text-sm text-tint-muted">{description}</p>
      ) : null}
      {children}
      {actions ?? action}
    </div>
  );
}

export type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  ref?: Ref<HTMLDivElement>;
  label?: string;
  description?: ReactNode;
  icon?: ReactNode;
};
export function LoadingState({
  ref,
  label = "Loading",
  description,
  icon,
  children,
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      ref={ref}
      data-tint-loading-state
      aria-label={label}
      aria-busy="true"
      className={cn(
        "grid place-items-center gap-2 p-8 text-sm text-tint-muted",
        className,
      )}
      {...props}
    >
      {icon ?? <Spinner />}
      <span>{label}</span>
      {description}
      {children}
    </div>
  );
}

export type ResponsiveNavRailProps = NavRailProps & {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  mobileLabel?: string;
};
/** Persistent rail on desktop, focus-contained navigation drawer below 768px. */
export function ResponsiveNavRail({
  mobileOpen,
  onMobileOpenChange,
  mobileLabel = "Navigation",
  ...props
}: ResponsiveNavRailProps) {
  const [mobile, setMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(max-width: 767px)");
    const change = () => setMobile(media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  if (!mobile) return <NavRail {...props} />;
  return (
    <div data-tint-mobile-navigation>
      <div className="flex min-h-12 items-center justify-between border-b border-tint-border bg-tint-panel px-4">
        {props.header}
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-haspopup="dialog"
          onClick={() => onMobileOpenChange(true)}
        >
          Menu
        </button>
      </div>
      <Dialog
        open={mobileOpen}
        onOpenChange={onMobileOpenChange}
        title={mobileLabel}
        placement="right"
      >
        <NavRail
          {...props}
          header={undefined}
          collapsed={false}
          onCollapsedChange={undefined}
          onClick={(event) => {
            props.onClick?.(event);
            const anchor = (event.target as Element).closest("a");
            if (
              anchor &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            )
              onMobileOpenChange(false);
          }}
        />
      </Dialog>
    </div>
  );
}
