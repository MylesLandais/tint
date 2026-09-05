import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BeatGridOverlay } from './BeatGridOverlay'
import { TransitionRegion } from './TransitionRegion'
import { WaveformCanvas } from './WaveformCanvas'
import { createTimelineViewport } from './viewport'

const viewport = createTimelineViewport({
  totalBeats: 128,
  widthPixels: 320,
  pixelsPerBeat: 10,
  scrollBeat: 16,
})

describe('timeline overlays', () => {
  it('places beat and bar lines through the shared viewport transform', () => {
    const { container } = render(
      <BeatGridOverlay viewport={viewport} beatsPerBar={4} />,
    )

    const beat16 = container.querySelector('[data-beat="16"]')
    const beat20 = container.querySelector('[data-beat="20"]')
    expect(beat16).toHaveStyle({ left: '0px' })
    expect(beat20).toHaveStyle({ left: '40px' })
    expect(beat16).toHaveAttribute('data-bar-line', 'true')
    expect(container.querySelector('[data-beat="17"]')).toHaveAttribute('data-bar-line', 'false')
    expect(container.querySelector('[data-beat="49"]')).toBeNull()
  })

  it('clips a labelled transition region to the visible viewport', () => {
    render(
      <TransitionRegion
        viewport={viewport}
        startBeat={8}
        endBeat={24}
        label="Here We Go to Apapacho"
      />,
    )

    const region = screen.getByRole('region', { name: 'Here We Go to Apapacho' })
    expect(region).toHaveStyle({ left: '0px', width: '80px' })
  })
})

describe('WaveformCanvas', () => {
  it('reports pointer seek intent in musical beats without owning transport state', () => {
    const onSeek = vi.fn()
    const { container } = render(
      <WaveformCanvas
        viewport={viewport}
        peaks={[0.2, 0.6, 1, 0.4]}
        color="#8b5cf6"
        onSeek={onSeek}
      />,
    )
    const canvas = container.querySelector('canvas')!
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 320,
      bottom: 80,
      width: 320,
      height: 80,
      toJSON: () => ({}),
    })

    fireEvent.click(canvas, { clientX: 100 })
    expect(onSeek).toHaveBeenCalledWith(26)
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
    expect(canvas).not.toHaveAttribute('tabindex')
  })
})
