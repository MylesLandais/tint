import { useId, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../lib/utils";

export type WorkspaceSplitProps = {
  /** Horizontal arranges panes left/right; vertical arranges them top/bottom. */
  direction?: "horizontal" | "vertical";
  /** Which pane has the controlled pixel size. The other fills available space. */
  primary?: "first" | "second";
  size: number;
  minSize?: number;
  maxSize?: number;
  onSizeChange: (size: number) => void;
  label: string;
  first: ReactNode;
  second: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** Nest splits to compose a layout. Hosts own persistence and domain content. */
export function WorkspaceSplit({
  direction = "horizontal", primary = "first", size, minSize = 0,
  maxSize = 1000, onSizeChange, label, first, second, className, style,
}: WorkspaceSplitProps) {
  const id = useId();
  const drag = useRef<{ pointer: number; start: number; size: number } | null>(null);
  const horizontal = direction === "horizontal";
  const sign = primary === "first" ? 1 : -1;
  const clamp = (value: number) => Math.max(minSize, Math.min(maxSize, value));
  const current = clamp(size);
  const tracks = primary === "first"
    ? `${current}px 5px minmax(0, 1fr)`
    : `minmax(0, 1fr) 5px ${current}px`;
  const paneStyle: CSSProperties = { display: "grid", minWidth: 0, minHeight: 0, overflow: "auto" };
  return (
    <div data-tint-workspace-split data-direction={direction} className={className}
      style={{ ...style, display: "grid", minWidth: 0, minHeight: 0,
        [horizontal ? "gridTemplateColumns" : "gridTemplateRows"]: tracks }}>
      <div id={`${id}-first`} data-tint-workspace-pane="first" style={paneStyle}>{first}</div>
      <div role="separator" tabIndex={0} aria-label={label}
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-controls={`${id}-${primary}`} aria-valuemin={minSize}
        aria-valuemax={maxSize} aria-valuenow={current} aria-valuetext={`${current} pixels`}
        data-tint-workspace-separator
        className={cn("hover:bg-tint-accent/40 focus-visible:bg-tint-accent/40 focus-visible:outline focus-visible:outline-tint-accent", horizontal ? "cursor-col-resize" : "cursor-row-resize")}
        style={{ touchAction: "none", userSelect: "none" }}
        onPointerDown={(event) => {
          if (event.button !== 0 || drag.current) return;
          event.preventDefault();
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { pointer: event.pointerId, start: horizontal ? event.clientX : event.clientY, size: current };
        }}
        onPointerMove={(event) => {
          const active = drag.current;
          if (!active || active.pointer !== event.pointerId) return;
          onSizeChange(clamp(active.size + ((horizontal ? event.clientX : event.clientY) - active.start) * sign));
        }}
        onPointerUp={(event) => {
          if (drag.current?.pointer !== event.pointerId) return;
          drag.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          if (drag.current?.pointer === event.pointerId) drag.current = null;
        }}
        onLostPointerCapture={() => { drag.current = null; }}
        onKeyDown={(event) => {
          const delta = event.key === (horizontal ? "ArrowRight" : "ArrowDown") ? 10
            : event.key === (horizontal ? "ArrowLeft" : "ArrowUp") ? -10 : 0;
          if (!delta && event.key !== "Home" && event.key !== "End") return;
          event.preventDefault();
          onSizeChange(event.key === "Home" ? minSize : event.key === "End" ? maxSize
            : clamp(current + delta * sign * (event.shiftKey ? 5 : 1)));
        }}
      />
      <div id={`${id}-second`} data-tint-workspace-pane="second" style={paneStyle}>{second}</div>
    </div>
  );
}
