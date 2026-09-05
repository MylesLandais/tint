import type {
  TimelineBeatRange,
  TimelineViewport,
  TimelineViewportInput,
} from './contracts'

export function createTimelineViewport(input: TimelineViewportInput): TimelineViewport {
  requirePositiveFinite(input.totalBeats, 'Timeline total beats')
  requirePositiveFinite(input.widthPixels, 'Timeline width')
  requirePositiveFinite(input.pixelsPerBeat, 'Timeline zoom')
  requireFinite(input.scrollBeat, 'Timeline scroll beat')

  return {
    ...input,
    scrollBeat: clampScrollBeat(input, input.scrollBeat),
  }
}

export function beatToPixel(viewport: TimelineViewport, beat: number): number {
  requireFinite(beat, 'Timeline beat')
  return (beat - viewport.scrollBeat) * viewport.pixelsPerBeat
}

export function pixelToBeat(viewport: TimelineViewport, pixel: number): number {
  requireFinite(pixel, 'Timeline pixel')
  return viewport.scrollBeat + pixel / viewport.pixelsPerBeat
}

export function timelineVisibleRange(viewport: TimelineViewport): TimelineBeatRange {
  return {
    startBeat: viewport.scrollBeat,
    endBeat: Math.min(
      viewport.totalBeats,
      viewport.scrollBeat + viewport.widthPixels / viewport.pixelsPerBeat,
    ),
  }
}

export function withTimelineScroll(
  viewport: TimelineViewport,
  scrollBeat: number,
): TimelineViewport {
  requireFinite(scrollBeat, 'Timeline scroll beat')
  return {
    ...viewport,
    scrollBeat: clampScrollBeat(viewport, scrollBeat),
  }
}

export function withTimelineZoom(
  viewport: TimelineViewport,
  pixelsPerBeat: number,
  anchorPixel: number,
): TimelineViewport {
  requirePositiveFinite(pixelsPerBeat, 'Timeline zoom')
  requireFinite(anchorPixel, 'Timeline zoom anchor')

  const anchorBeat = pixelToBeat(viewport, anchorPixel)
  const zoomed = { ...viewport, pixelsPerBeat }
  return withTimelineScroll(zoomed, anchorBeat - anchorPixel / pixelsPerBeat)
}

function clampScrollBeat(
  viewport: Pick<TimelineViewport, 'totalBeats' | 'widthPixels' | 'pixelsPerBeat'>,
  scrollBeat: number,
): number {
  const visibleBeats = viewport.widthPixels / viewport.pixelsPerBeat
  const maximum = Math.max(0, viewport.totalBeats - visibleBeats)
  return Math.min(maximum, Math.max(0, scrollBeat))
}

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number`)
  }
}

function requireFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`)
}
