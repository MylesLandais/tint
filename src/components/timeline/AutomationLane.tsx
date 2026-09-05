import type { AutomationPoint, TimelineViewport } from './contracts'
import { beatToPixel, timelineVisibleRange } from './viewport'

export type AutomationLaneProps = {
  viewport: TimelineViewport
  label: string
  points: readonly AutomationPoint[]
  min?: number
  max?: number
  step?: number
  onPointChange: (index: number, point: AutomationPoint) => void
  className?: string
}

export function AutomationLane({
  viewport,
  label,
  points,
  min = 0,
  max = 1,
  step = 0.01,
  onPointChange,
  className,
}: AutomationLaneProps) {
  if (![min, max, step].every(Number.isFinite) || max <= min || step <= 0) {
    throw new RangeError('Automation lane range must be finite and increasing')
  }
  points.forEach((point, index) => {
    if (!Number.isFinite(point.beat) || !Number.isFinite(point.value)) {
      throw new RangeError('Automation points must contain finite values')
    }
    if (index > 0 && point.beat < points[index - 1]!.beat) {
      throw new RangeError('Automation points must be ordered by beat')
    }
  })

  const visible = timelineVisibleRange(viewport)
  const valueToPercent = (value: number) => 100 - ((value - min) / (max - min)) * 100

  return (
    <section
      aria-label={label}
      data-tint-automation-lane=""
      className={className ?? 'relative h-24 overflow-hidden rounded-md border border-tint-border bg-tint-surface'}
    >
      <span className="sr-only">{label}</span>
      <svg aria-hidden="true" className="absolute inset-0 size-full" preserveAspectRatio="none">
        {points.slice(0, -1).map((point, index) => {
          const next = points[index + 1]!
          return (
            <line
              key={`${point.beat}-${next.beat}-${index}`}
              data-automation-segment=""
              x1={beatToPixel(viewport, point.beat)}
              y1={`${valueToPercent(point.value)}%`}
              x2={beatToPixel(viewport, next.beat)}
              y2={`${valueToPercent(next.value)}%`}
              stroke="currentColor"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      {points.map((point, index) => {
        if (point.beat < visible.startBeat || point.beat > visible.endBeat) return null
        return (
          <input
            key={`${point.beat}-${index}`}
            type="range"
            aria-label={`${label} point ${index + 1}`}
            min={min}
            max={max}
            step={step}
            value={point.value}
            className="absolute z-10 h-11 w-20 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize appearance-none bg-transparent"
            style={{
              left: `${beatToPixel(viewport, point.beat)}px`,
              top: `${valueToPercent(point.value)}%`,
            }}
            onChange={(event) => onPointChange(index, {
              beat: point.beat,
              value: Number(event.currentTarget.value),
            })}
          />
        )
      })}
    </section>
  )
}
