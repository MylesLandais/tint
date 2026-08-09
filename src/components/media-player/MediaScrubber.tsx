import { useMemo, useState, type PointerEvent } from 'react'
import { cn } from '../../lib/utils'
import { Slider, Waveform } from '../media'

export type MediaScrubberProps = {
  /** Playback position, `0..100` — matches `Slider`. */
  progress: number
  /** Called with the seek target, `0..100`. */
  onSeek: (percentage: number) => void
  /** Raw amplitude samples, any scale. Normalized to `0..1` internally. */
  waveform?: readonly number[]
  /** A literal, canvas-parseable color for the waveform's played region. */
  color: string
  /** Feeds `Slider`'s `aria-label` as `Seek {label}`. */
  label: string
  className?: string
  /** Height class for the waveform band. Defaults to the `md`/`lg` size. */
  waveformClassName?: string
  tone?: 'surface' | 'chrome'
}

/**
 * Internal composition of `Waveform` behind `Slider`, used at every size
 * tier. `Slider` stays the sole keyboard-accessible seek control; the canvas
 * is a pointer-only enhancement that shares the same `onSeek` callback, so
 * both stay in sync. Not exported from the package — `MediaPlayer` is the
 * only consumer.
 */
export function MediaScrubber({
  progress,
  onSeek,
  waveform,
  color,
  label,
  className,
  waveformClassName,
  tone = 'surface',
}: MediaScrubberProps) {
  const [hoverProgress, setHoverProgress] = useState<number | null>(null)

  const peaks = useMemo(() => {
    if (!waveform?.length) return undefined
    const peak = Math.max(...waveform, 1)
    return waveform.map((amplitude) => Math.min(Math.max(amplitude / peak, 0), 1))
  }, [waveform])

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    setHoverProgress(Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1))
  }

  return (
    <div className={cn('relative min-w-12 flex-1 py-2', className)}>
      {peaks ? (
        <div
          className={cn('absolute inset-x-0 top-1/2 h-4 -translate-y-1/2', waveformClassName)}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverProgress(null)}
        >
          <Waveform
            peaks={peaks}
            progress={progress / 100}
            hoverProgress={hoverProgress}
            color={color}
            onSeek={(p) => onSeek(p * 100)}
          />
        </div>
      ) : null}
      <Slider
        value={progress}
        onChange={onSeek}
        aria-label={`Seek ${label}`}
        showThumb
        fillClassName={tone === 'chrome' ? 'bg-tint-chrome-ink' : 'bg-tint-accent'}
        thumbClassName={tone === 'chrome' ? 'bg-tint-chrome-ink' : 'bg-tint-ink'}
        className={cn('h-px', tone === 'chrome' ? 'text-tint-chrome-ink' : 'text-tint-ink')}
      />
    </div>
  )
}
