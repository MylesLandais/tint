import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import type { TimelineViewport } from './contracts'
import { beatToPixel, pixelToBeat, timelineVisibleRange } from './viewport'

export type WaveformCanvasProps = {
  viewport: TimelineViewport
  /** Normalized peak amplitudes in `0..1`, spanning the full musical document. */
  peaks: readonly number[]
  /** Literal canvas-compatible color. */
  color: string
  onSeek: (beat: number) => void
  className?: string
}

export function WaveformCanvas({
  viewport,
  peaks,
  color,
  onSeek,
  className,
}: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const width = viewport.widthPixels
    const height = canvas.offsetHeight || 80
    const deviceScale = window.devicePixelRatio || 1
    canvas.width = width * deviceScale
    canvas.height = height * deviceScale
    context.setTransform(deviceScale, 0, 0, deviceScale, 0, 0)
    context.clearRect(0, 0, width, height)
    context.fillStyle = color

    if (peaks.length === 0) return
    const visible = timelineVisibleRange(viewport)
    const beatPerPeak = viewport.totalBeats / peaks.length
    const first = Math.max(0, Math.floor(visible.startBeat / beatPerPeak))
    const last = Math.min(peaks.length - 1, Math.ceil(visible.endBeat / beatPerPeak))
    const barWidth = Math.max(1, beatPerPeak * viewport.pixelsPerBeat)
    const midpoint = height / 2

    for (let index = first; index <= last; index += 1) {
      const amplitude = Math.min(1, Math.max(0, peaks[index] ?? 0))
      const barHeight = Math.max(1, amplitude * height * 0.9)
      const x = beatToPixel(viewport, index * beatPerPeak)
      context.fillRect(x, midpoint - barHeight / 2, barWidth, barHeight)
    }
  }, [color, peaks, viewport])

  useEffect(() => {
    draw()
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [draw])

  const handleClick = (event: ReactMouseEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    if (bounds.width <= 0) return
    const viewportPixel = ((event.clientX - bounds.left) / bounds.width) * viewport.widthPixels
    const beat = pixelToBeat(viewport, viewportPixel)
    onSeek(Math.min(viewport.totalBeats, Math.max(0, beat)))
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-tint-waveform-canvas=""
      className={className ?? 'size-full cursor-pointer touch-none'}
      onClick={handleClick}
    />
  )
}
