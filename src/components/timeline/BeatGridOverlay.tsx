import type { TimelineViewport } from './contracts'
import { beatToPixel, timelineVisibleRange } from './viewport'

export type BeatGridOverlayProps = {
  viewport: TimelineViewport
  beatsPerBar: number
  className?: string
}

export function BeatGridOverlay({
  viewport,
  beatsPerBar,
  className,
}: BeatGridOverlayProps) {
  if (!Number.isFinite(beatsPerBar) || beatsPerBar <= 0) {
    throw new RangeError('Beat grid beats per bar must be a positive finite number')
  }

  const visible = timelineVisibleRange(viewport)
  const firstBeat = Math.ceil(visible.startBeat)
  const lastBeat = Math.floor(visible.endBeat)
  const beats = Array.from(
    { length: Math.max(0, lastBeat - firstBeat + 1) },
    (_, index) => firstBeat + index,
  )

  return (
    <div
      aria-hidden="true"
      className={className}
      data-tint-beat-grid=""
    >
      {beats.map((beat) => {
        const isBar = beat % beatsPerBar === 0
        return (
          <span
            key={beat}
            data-beat={beat}
            data-bar-line={String(isBar)}
            className={isBar ? 'absolute inset-y-0 border-l border-current/45' : 'absolute inset-y-0 border-l border-current/15'}
            style={{ left: `${beatToPixel(viewport, beat)}px` }}
          />
        )
      })}
    </div>
  )
}
