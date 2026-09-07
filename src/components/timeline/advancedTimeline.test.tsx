import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AutomationLane } from './AutomationLane'
import { DualWaveform } from '../dj/DualWaveform'
import { createTimelineViewport } from './viewport'

const viewport = createTimelineViewport({
  totalBeats: 128,
  widthPixels: 640,
  pixelsPerBeat: 5,
  scrollBeat: 0,
})

describe('DualWaveform', () => {
  it('composes both decks, one grid, and one transition region over the same viewport', () => {
    const onSeek = vi.fn()
    const { container } = render(
      <DualWaveform
        viewport={viewport}
        outgoing={{ label: 'Here We Go', peaks: [0.2, 0.8, 0.4], color: '#f97316' }}
        incoming={{ label: 'Apapacho', peaks: [0.6, 0.3, 1], color: '#8b5cf6' }}
        transition={{ startBeat: 32, endBeat: 96, label: 'Blend transition' }}
        beatsPerBar={4}
        onSeek={onSeek}
      />,
    )

    expect(screen.getByText('Here We Go')).toBeInTheDocument()
    expect(screen.getByText('Apapacho')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-tint-waveform-canvas]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-tint-beat-grid]')).toHaveLength(1)
    expect(screen.getByRole('region', { name: 'Blend transition' })).toBeInTheDocument()
  })
})

describe('AutomationLane', () => {
  it('positions controlled points in musical time and reports value edits', () => {
    const onPointChange = vi.fn()
    const { container, rerender } = render(
      <AutomationLane
        viewport={viewport}
        label="Incoming low EQ"
        points={[
          { beat: 0, value: 0 },
          { beat: 64, value: 0 },
          { beat: 128, value: 1 },
        ]}
        onPointChange={onPointChange}
      />,
    )

    const midpoint = screen.getByRole('slider', { name: 'Incoming low EQ point 2' })
    expect(midpoint).toHaveStyle({ left: '320px' })
    fireEvent.change(midpoint, { target: { value: '0.4' } })
    expect(onPointChange).toHaveBeenCalledWith(1, { beat: 64, value: 0.4 })

    rerender(
      <AutomationLane
        viewport={viewport}
        label="Incoming low EQ"
        points={[
          { beat: 0, value: 0 },
          { beat: 64, value: 0.4 },
          { beat: 128, value: 1 },
        ]}
        onPointChange={onPointChange}
      />,
    )
    expect(midpoint).toHaveValue('0.4')
    expect(container.querySelectorAll('[data-automation-segment]')).toHaveLength(2)
  })

  it('clips offscreen points while retaining visible connecting segments', () => {
    const scrolled = createTimelineViewport({
      totalBeats: 128,
      widthPixels: 320,
      pixelsPerBeat: 5,
      scrollBeat: 32,
    })
    const { container } = render(
      <AutomationLane
        viewport={scrolled}
        label="Outgoing gain"
        points={[{ beat: 0, value: 1 }, { beat: 64, value: 0.5 }, { beat: 128, value: 0 }]}
        onPointChange={vi.fn()}
      />,
    )

    expect(screen.queryByRole('slider', { name: 'Outgoing gain point 1' })).toBeNull()
    expect(screen.getByRole('slider', { name: 'Outgoing gain point 2' })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-automation-segment]')).toHaveLength(2)
  })
})
