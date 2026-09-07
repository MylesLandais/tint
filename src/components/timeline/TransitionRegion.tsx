import type { TimelineViewport } from './contracts'
import { beatToPixel, timelineVisibleRange } from './viewport'

export type TransitionRegionProps = {
  viewport: TimelineViewport
  startBeat: number
  endBeat: number
  label: string
  className?: string
}

export function TransitionRegion({
  viewport,
  startBeat,
  endBeat,
  label,
  className,
}: TransitionRegionProps) {
  if (!Number.isFinite(startBeat) || !Number.isFinite(endBeat) || endBeat <= startBeat) {
    throw new RangeError('Transition region must have finite increasing beat bounds')
  }

  const visible = timelineVisibleRange(viewport)
  const clippedStart = Math.max(startBeat, visible.startBeat)
  const clippedEnd = Math.min(endBeat, visible.endBeat)
  if (clippedEnd <= clippedStart) return null

  return (
    <div
      role="region"
      aria-label={label}
      data-tint-transition-region=""
      className={className ?? 'absolute inset-y-0 border-x border-tint-accent/70 bg-tint-accent/15'}
      style={{
        left: `${beatToPixel(viewport, clippedStart)}px`,
        width: `${beatToPixel(viewport, clippedEnd) - beatToPixel(viewport, clippedStart)}px`,
      }}
    />
  )
}
