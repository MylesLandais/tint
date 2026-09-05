import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import { Icon } from "../icon";
import type { NavGroup, NavRailItem } from "./Shell";

export type TopNavProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
  brand?: ReactNode;
  groups: readonly NavGroup[];
  activeId?: string;
  onNavigate?: (id: string, href: string) => void;
  maxVisibleItems?: number;
  overflowLabel?: string;
  actions?: ReactNode;
};

export function TopNav({
  ref,
  brand,
  groups,
  activeId,
  onNavigate,
  maxVisibleItems,
  overflowLabel = "More",
  actions,
  className,
  ...props
}: TopNavProps) {
  const moreRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const flat = groups.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) => ({
      item,
      divider: groupIndex > 0 && itemIndex === 0,
    })),
  );
  const hasOverflow =
    maxVisibleItems !== undefined && flat.length > maxVisibleItems;
  const visible = hasOverflow ? flat.slice(0, maxVisibleItems) : flat;
  const overflow = hasOverflow ? flat.slice(maxVisibleItems) : [];
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);
  const link = (
    entry: { item: NavRailItem; divider: boolean },
    index: number,
    inMenu: boolean,
  ) => {
    const item = entry.item;
    return (
      <span key={item.id} className="contents">
        {entry.divider && index > 0 ? (
          <span
            aria-hidden="true"
            className={
              inMenu
                ? "h-px bg-tint-border"
                : "mx-1 h-5 w-px shrink-0 bg-tint-border"
            }
          />
        ) : null}
        <a
          href={item.href}
          aria-current={item.id === activeId ? "page" : undefined}
          aria-disabled={item.disabled || undefined}
          onClick={(event) => {
            if (item.disabled) {
              event.preventDefault();
              return;
            }
            setOpen(false);
            onNavigate?.(item.id, item.href);
          }}
          className={cn(
            "flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-tint-muted hover:bg-tint-surface hover:text-tint-ink",
            item.id === activeId && "bg-tint-accent-soft text-tint-accent",
            item.disabled && "pointer-events-none opacity-50",
          )}
        >
          {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {item.badge}
        </a>
      </span>
    );
  };
  return (
    <nav
      ref={ref}
      data-tint-top-nav
      className={cn(
        "flex min-h-12 items-center gap-1 border-b border-tint-border bg-tint-panel px-3",
        className,
      )}
      {...props}
    >
      {brand ? (
        <div
          data-tint-top-nav-brand
          className="mr-2 flex shrink-0 items-center"
        >
          {brand}
        </div>
      ) : null}
      <div
        data-testid="top-nav-items"
        className="flex min-w-0 items-center gap-1"
      >
        {visible.map((entry, index) => link(entry, index, false))}
        {overflow.length ? (
          <div ref={moreRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className="flex min-h-9 items-center gap-1 rounded-lg px-3 text-sm text-tint-muted hover:bg-tint-surface hover:text-tint-ink"
            >
              {overflowLabel}
              <Icon icon={ChevronDown} size="sm" />
            </button>
            {open ? (
              <div
                role="menu"
                data-tint-top-nav-overflow
                className="absolute right-0 top-full z-50 mt-1 flex w-48 flex-col gap-1 rounded-xl border border-tint-border bg-tint-panel p-2 shadow-xl"
              >
                {overflow.map((entry, index) => link(entry, index, true))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div
          data-tint-top-nav-actions
          className="ml-auto flex shrink-0 items-center gap-2"
        >
          {actions}
        </div>
      ) : null}
    </nav>
  );
}
