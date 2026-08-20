import {
  useCallback,
  useRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { cn } from '../../lib/utils'

export type SplitPaneProps = HTMLAttributes<HTMLDivElement> & {
  /** Left (or first) pane. */
  start: ReactNode
  /** Middle pane when `end` is set; otherwise the right pane. */
  middle: ReactNode
  /** Optional third pane (reader / inspector). */
  end?: ReactNode
  /**
   * Widths in CSS length strings. Host owns them so resize survives remounts
   * and can be persisted — uncontrolled defaults would fight a workbench shell.
   */
  startWidth?: string
  middleWidth?: string
  endWidth?: string
  onStartWidthChange?: (widthPx: number) => void
  onMiddleWidthChange?: (widthPx: number) => void
  /** Minimum pane width while dragging. */
  minPanePx?: number
}

/**
 * Two- or three-column resizable shell.
 *
 * Drag reports pixel widths via callbacks; the host sets the width props. The
 * component never stores widths itself — that prevented "snap back" when a
 * parent re-rendered from document revision updates.
 */
export function SplitPane({
  start,
  middle,
  end,
  startWidth = '14rem',
  middleWidth = '1fr',
  endWidth = '22rem',
  onStartWidthChange,
  onMiddleWidthChange,
  minPanePx = 120,
  className,
  ...props
}: SplitPaneProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  const drag = useCallback(
    (
      event: ReactPointerEvent<HTMLDivElement>,
      which: 'start' | 'middle',
      onChange?: (widthPx: number) => void,
    ) => {
      if (!onChange || !rootRef.current) return
      event.preventDefault()
      const root = rootRef.current
      const handle = event.currentTarget
      const pane = handle.previousElementSibling as HTMLElement | null
      if (!pane) return
      const startX = event.clientX
      const startW = pane.getBoundingClientRect().width
      const max = root.getBoundingClientRect().width - minPanePx * (end ? 2 : 1)

      const onMove = (moveEvent: PointerEvent) => {
        const next = Math.min(max, Math.max(minPanePx, startW + (moveEvent.clientX - startX)))
        onChange(Math.round(next))
      }
      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      void which
    },
    [end, minPanePx],
  )

  const columns = end
    ? `${startWidth} 6px ${middleWidth} 6px ${endWidth}`
    : `${startWidth} 6px ${middleWidth}`

  return (
    <div
      ref={rootRef}
      data-tint-split-pane=""
      data-panes={end ? 3 : 2}
      className={cn('grid min-h-0 min-w-0 overflow-hidden', className)}
      style={{ gridTemplateColumns: columns }}
      {...props}
    >
      <div data-tint-split-pane-start="" className="min-h-0 min-w-0 overflow-auto">
        {start}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize start pane"
        data-tint-split-handle="start"
        className="cursor-col-resize bg-tint-border/60 hover:bg-tint-accent"
        onPointerDown={(event) => drag(event, 'start', onStartWidthChange)}
      />
      <div data-tint-split-pane-middle="" className="min-h-0 min-w-0 overflow-auto">
        {middle}
      </div>
      {end ? (
        <>
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize middle pane"
            data-tint-split-handle="middle"
            className="cursor-col-resize bg-tint-border/60 hover:bg-tint-accent"
            onPointerDown={(event) => drag(event, 'middle', onMiddleWidthChange)}
          />
          <div data-tint-split-pane-end="" className="min-h-0 min-w-0 overflow-auto">
            {end}
          </div>
        </>
      ) : null}
    </div>
  )
}
