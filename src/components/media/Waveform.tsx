import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'

export type WaveformProps = {
  /** Pre-normalized amplitude samples, each in `0..1`. */
  peaks: readonly number[]
  /** Playback position, `0..1`. */
  progress: number
  /** Pointer position over the track, `0..1`, or `null` when not hovered. Owned
      by the caller — the canvas itself has no pointer-move listener. */
  hoverProgress: number | null
  /** A literal, canvas-parseable color (hex/rgb/resolved custom property).
      `CanvasRenderingContext2D.fillStyle` cannot resolve `var(--tint-*)`. */
  color: string
  /** Called with the click position, `0..1`. */
  onSeek: (progress: number) => void
}

/**
 * Decorative canvas waveform, drawn behind the real seek control. Doubles as
 * a pointer-only seek surface: `Slider` stays the sole keyboard-accessible
 * control, so this stays out of the tab order.
 */
export function Waveform({ peaks, progress, hoverProgress, color, onSeek }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const barCount = peaks.length
    if (barCount === 0) return
    const barWidth = width / barCount
    const gap = Math.max(0.5, barWidth * 0.18)
    const mid = height / 2

    for (let index = 0; index < barCount; index += 1) {
      const amplitude = peaks[index]
      const barHeight = Math.max(2, amplitude * (height * 0.88))
      const x = index * barWidth
      const position = index / barCount

      let fillStyle: string
      if (hoverProgress !== null && position <= hoverProgress) {
        fillStyle = position <= progress ? color : `color-mix(in srgb, ${color} 33%, transparent)`
      } else if (position <= progress) {
        fillStyle = color
      } else {
        // Matches Slider's `bg-current/20` track: unplayed color follows
        // whatever text color the caller sets on the wrapping element.
        fillStyle = 'color-mix(in srgb, currentColor 20%, transparent)'
      }

      ctx.fillStyle = fillStyle
      ctx.fillRect(x, mid - barHeight / 2, barWidth - gap, barHeight)
    }

    if (progress > 0) {
      const playheadX = progress * width
      ctx.fillStyle = color
      ctx.fillRect(playheadX - 1, 0, 2, height)
    }
  }, [peaks, progress, hoverProgress, color])

  useEffect(() => {
    draw()
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [draw])

  const handleClick = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    onSeek(Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1))
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="size-full cursor-pointer"
      onClick={handleClick}
    />
  )
}
