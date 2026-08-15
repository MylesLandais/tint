import { useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import type { GraphCommand, GraphDocument, GraphSelection } from './contracts'
import { emptySelection } from './contracts'
import {
  projectTimeline,
  type GraphSpan,
  type TimelineInterval,
  type TimelineVariant,
} from './projections/timeline'
import { cn } from '../../lib/utils'

/** Keyboard nudge, as a fraction of the visible domain. */
const NUDGE = 0.02

export type TimelineViewProps = {
  document: GraphDocument
  spans: readonly GraphSpan[]
  /**
   * `gantt` — a lane per node, in dependency order.
   * `trace` — a lane per span, indented by parent depth.
   * `range` — one lane, and the only editable variant.
   */
  variant?: TimelineVariant
  selection?: GraphSelection
  className?: string
  /**
   * Emitted when the `range` variant edits a span.
   *
   * Deliberately not a `GraphCommand`: spans are an overlay on the document, not
   * part of it, so `applyCommand` has nothing to reduce them into. A host
   * treating a range as *authored* schedule rather than observed runtime maps
   * this to a `node.configure` command itself — which is the honest seam between
   * a plan and a trace, and putting it in the command union would have erased
   * the distinction.
   */
  onSpanChange?: (spanId: string, next: { start: number; end: number }) => void
  onSelectionChange?: (selection: GraphSelection) => void
  onCommand?: (command: GraphCommand) => void
}

/**
 * The interval projection: Gantt, trace, and editable range are one component
 * because they are one model. If keeping them together ever requires a third
 * branch that is not lane assignment or chrome, the claim that a single document
 * serves every view has found its first real counterexample — which is worth
 * knowing, and worth not hiding behind three separate components.
 */
export function TimelineView({
  document,
  spans,
  variant = 'gantt',
  selection = emptySelection(),
  className,
  onSpanChange,
  onSelectionChange,
  onCommand,
}: TimelineViewProps) {
  const projection = useMemo(
    () => projectTimeline(document, spans, { variant }),
    [document, spans, variant],
  )
  const domain = Math.max(projection.end - projection.start, 1)
  const editable = variant === 'range' && onSpanChange != null

  function fractionOf(value: number): number {
    return (value - projection.start) / domain
  }

  function select(interval: TimelineInterval) {
    if (interval.nodeId == null) return
    const next: GraphSelection = {
      nodeIds: new Set([interval.nodeId]),
      edgeIds: new Set(),
      groupIds: new Set(),
      primary: { kind: 'node', id: interval.nodeId },
    }
    onCommand?.({ type: 'selection.replace', selection: next })
    onSelectionChange?.(next)
  }

  return (
    <div
      data-tint-timeline
      data-variant={variant}
      className={cn('tint-timeline', className)}
    >
      {projection.tracks.length === 0 || spans.length === 0 ? (
        <p className="tint-timeline__empty">No spans for this graph.</p>
      ) : (
        <ol className="tint-timeline__tracks" aria-label={`${variant} timeline`}>
          {projection.tracks.map((track) => (
            <li key={track.id} className="tint-timeline__track">
              <span className="tint-timeline__track-label" title={track.label}>
                {track.label}
              </span>
              <div className="tint-timeline__lane">
                {track.intervals.map((interval) => (
                  <IntervalBar
                    key={interval.id}
                    interval={interval}
                    left={fractionOf(interval.start)}
                    width={Math.max((interval.end - interval.start) / domain, 0.004)}
                    domain={domain}
                    start={projection.start}
                    editable={editable}
                    selected={
                      interval.nodeId != null && selection.nodeIds.has(interval.nodeId)
                    }
                    onSelect={() => select(interval)}
                    onChange={onSpanChange}
                  />
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

type IntervalBarProps = {
  interval: TimelineInterval
  left: number
  width: number
  domain: number
  start: number
  editable: boolean
  selected: boolean
  onSelect: () => void
  onChange?: (spanId: string, next: { start: number; end: number }) => void
}

/**
 * Pointer handling follows `components/media/Slider.tsx` — capture on down,
 * guard move with `hasPointerCapture`, derive a clamped fraction from the
 * track's rect. The Slider component itself is a single 0–100 value and does not
 * fit an interval with two independently draggable edges, so the idiom is reused
 * rather than the component.
 */
function IntervalBar({
  interval,
  left,
  width,
  domain,
  start,
  editable,
  selected,
  onSelect,
  onChange,
}: IntervalBarProps) {
  const laneRef = useRef<HTMLDivElement>(null)
  const dragging = useRef<'start' | 'end' | null>(null)

  function valueFromPointer(clientX: number): number | null {
    const rect = laneRef.current?.parentElement?.getBoundingClientRect()
    if (!rect || rect.width === 0) return null
    const fraction = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    return start + fraction * domain
  }

  function handleMove(event: ReactPointerEvent<HTMLSpanElement>) {
    if (dragging.current == null) return
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    const value = valueFromPointer(event.clientX)
    if (value == null) return
    // Edges cannot cross: dragging start past end would silently invert the
    // interval, and every consumer of `end - start` would then read a negative
    // duration.
    if (dragging.current === 'start') {
      onChange?.(interval.id, { start: Math.min(value, interval.end), end: interval.end })
    } else {
      onChange?.(interval.id, { start: interval.start, end: Math.max(value, interval.start) })
    }
  }

  function nudge(edge: 'start' | 'end', delta: number) {
    const amount = delta * NUDGE * domain
    if (edge === 'start') {
      onChange?.(interval.id, {
        start: Math.min(interval.start + amount, interval.end),
        end: interval.end,
      })
    } else {
      onChange?.(interval.id, {
        start: interval.start,
        end: Math.max(interval.end + amount, interval.start),
      })
    }
  }

  return (
    <div
      ref={laneRef}
      className="tint-timeline__bar"
      data-status={interval.status ?? 'ready'}
      data-selected={selected ? 'true' : 'false'}
      style={{
        left: `${left * 100}%`,
        width: `${width * 100}%`,
        marginInlineStart: `${interval.depth * 0.6}rem`,
      }}
    >
      <button
        type="button"
        className="tint-timeline__bar-body"
        onClick={onSelect}
        title={`${interval.label} — ${Math.round(interval.end - interval.start)}`}
      >
        <span className="tint-timeline__bar-label">{interval.label}</span>
      </button>
      {editable
        ? (['start', 'end'] as const).map((edge) => (
            <span
              key={edge}
              className="tint-timeline__handle"
              data-edge={edge}
              role="slider"
              tabIndex={0}
              aria-label={`${interval.label} ${edge}`}
              aria-valuemin={start}
              aria-valuemax={start + domain}
              aria-valuenow={edge === 'start' ? interval.start : interval.end}
              onPointerDown={(event) => {
                event.preventDefault()
                dragging.current = edge
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={handleMove}
              onPointerUp={(event) => {
                dragging.current = null
                event.currentTarget.releasePointerCapture(event.pointerId)
              }}
              onKeyDown={(event) => {
                const forward = event.key === 'ArrowRight' || event.key === 'ArrowUp'
                const back = event.key === 'ArrowLeft' || event.key === 'ArrowDown'
                if (!forward && !back) return
                event.preventDefault()
                nudge(edge, forward ? 1 : -1)
              }}
            />
          ))
        : null}
    </div>
  )
}
