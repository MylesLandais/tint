import { describe, expect, it } from 'vitest'
import {
  beatToPixel,
  createTimelineViewport,
  pixelToBeat,
  timelineVisibleRange,
  withTimelineScroll,
  withTimelineZoom,
} from './viewport'

describe('timeline viewport', () => {
  it('uses one reversible beats-to-pixels transform', () => {
    const viewport = createTimelineViewport({
      totalBeats: 256,
      widthPixels: 800,
      pixelsPerBeat: 12.5,
      scrollBeat: 32,
    })

    expect(beatToPixel(viewport, 40)).toBe(100)
    expect(pixelToBeat(viewport, 100)).toBe(40)
    expect(pixelToBeat(viewport, beatToPixel(viewport, 40.125))).toBeCloseTo(40.125, 10)
    expect(timelineVisibleRange(viewport)).toEqual({ startBeat: 32, endBeat: 96 })
  })

  it('preserves the musical beat under the zoom anchor', () => {
    const viewport = createTimelineViewport({
      totalBeats: 256,
      widthPixels: 800,
      pixelsPerBeat: 10,
      scrollBeat: 20,
    })
    const anchorPixel = 300
    const anchorBeat = pixelToBeat(viewport, anchorPixel)
    const zoomed = withTimelineZoom(viewport, 20, anchorPixel)

    expect(pixelToBeat(zoomed, anchorPixel)).toBe(anchorBeat)
    expect(zoomed.scrollBeat).toBe(35)
  })

  it('clamps scrolling and visible ranges to the document', () => {
    const viewport = createTimelineViewport({
      totalBeats: 64,
      widthPixels: 320,
      pixelsPerBeat: 10,
      scrollBeat: 999,
    })

    expect(viewport.scrollBeat).toBe(32)
    expect(withTimelineScroll(viewport, -10).scrollBeat).toBe(0)
    expect(withTimelineScroll(viewport, 100).scrollBeat).toBe(32)
    expect(timelineVisibleRange(viewport)).toEqual({ startBeat: 32, endBeat: 64 })
  })

  it('rejects non-finite and non-positive dimensions', () => {
    expect(() => createTimelineViewport({
      totalBeats: 0,
      widthPixels: 320,
      pixelsPerBeat: 10,
      scrollBeat: 0,
    })).toThrow(RangeError)
    expect(() => createTimelineViewport({
      totalBeats: 64,
      widthPixels: Number.NaN,
      pixelsPerBeat: 10,
      scrollBeat: 0,
    })).toThrow(RangeError)
  })
})
