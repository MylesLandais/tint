import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Icon } from "../icon";
import { cn } from "../../lib/utils";

export type DialogProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Whether the dialog is shown. */
  open: boolean;
  /** Called when the user dismisses via backdrop, Escape, or close control. */
  onOpenChange: (open: boolean) => void;
  /** Dialog title announced to assistive tech. */
  title: ReactNode;
  /** Optional description under the title. */
  description?: ReactNode;
  /** Footer actions (confirm/cancel). */
  actions?: ReactNode;
  /** Hide the built-in close button. */
  hideClose?: boolean;
  placement?: "center" | "right";
};

const dialogStack: HTMLElement[] = [];

/** Controlled modal dialog. Renders in a portal when open. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  actions,
  hideClose = false,
  placement = "center",
  className,
  children,
  ...props
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const dismiss = useRef(onOpenChange);
  useEffect(() => {
    dismiss.current = onOpenChange;
  }, [onOpenChange]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (!panel) return;
    dialogStack.push(panel);
    panel.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (dialogStack.at(-1) !== panel) return;
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss.current(false);
      }
      if (event.key === "Tab") {
        const nodes = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
          ) ?? [],
        ).filter((node) => !node.closest("[hidden]"));
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (!first) {
          event.preventDefault();
          panelRef.current?.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === panelRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            !nodes.includes(document.activeElement as HTMLElement))
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      dialogStack.splice(dialogStack.indexOf(panel), 1);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      data-dialog-root=""
      className={cn(
        "fixed inset-0 z-50 flex",
        placement === "right"
          ? "items-stretch justify-end"
          : "items-center justify-center p-4",
      )}
    >
      <button
        type="button"
        aria-label="Dismiss dialog"
        tabIndex={-1}
        className="absolute inset-0 bg-tint-ink/40"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        data-dialog=""
        className={cn(
          "relative z-10 flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-tint-border bg-tint-panel shadow-lg outline-none",
          placement === "right" &&
            "h-dvh max-h-dvh max-w-[min(95vw,32rem)] rounded-none",
          className,
        )}
        {...props}
      >
        <header className="flex items-start gap-3 border-b border-tint-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-tint-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-tint-muted">
                {description}
              </p>
            ) : null}
          </div>
          {hideClose ? null : (
            <button
              type="button"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-tint-muted transition hover:bg-tint-surface hover:text-tint-ink"
            >
              <Icon icon={X} size="sm" />
            </button>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 text-sm text-tint-ink">
          {children}
        </div>
        {actions ? (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-tint-border px-4 py-3">
            {actions}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
