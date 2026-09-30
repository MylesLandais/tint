import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { createTimelineViewport } from '../../../core/timeline/viewport'
import AutomationLane from './AutomationLane.svelte'
import BeatGridOverlay from './BeatGridOverlay.svelte'
import TransitionRegion from './TransitionRegion.svelte'
import WaveformCanvas from './WaveformCanvas.svelte'

const viewport = createTimelineViewport({ totalBeats: 128, widthPixels: 320, pixelsPerBeat: 10, scrollBeat: 16 })

describe('Svelte timeline', () => {
  it('positions beat and bar lines and clips transition regions through the shared viewport', () => {
    const grid = render(BeatGridOverlay, { viewport, beatsPerBar: 4 })
    expect(grid.container.querySelector('[data-beat="16"]')).toHaveStyle({ left: '0px' })
    expect(grid.container.querySelector('[data-beat="20"]')).toHaveAttribute('data-bar-line', 'true')
    expect(grid.container.querySelector('[data-beat="49"]')).toBeNull()
    render(TransitionRegion, { viewport, startBeat: 8, endBeat: 24, label: 'Blend' })
    expect(screen.getByRole('region', { name: 'Blend' })).toHaveStyle({ left: '0px', width: '80px' })
  })

  it('reports controlled automation edits and keeps the supplied slider value until update', async () => {
    const onPointChange = vi.fn()
    const points = [{ beat: 0, value: 0 }, { beat: 32, value: .5 }, { beat: 64, value: 1 }]
    const view = render(AutomationLane, { viewport, label: 'Low EQ', points, onPointChange })
    expect(screen.queryByRole('slider', { name: 'Low EQ point 1' })).toBeNull()
    const slider = screen.getByRole('slider', { name: 'Low EQ point 2' })
    expect(slider).toHaveStyle({ left: '160px' })
    await fireEvent.change(slider, { target: { value: '.7' } })
    expect(onPointChange).toHaveBeenCalledWith(1, { beat: 32, value: .7 })
    expect(slider).toHaveValue('0.5')
    await view.rerender({ viewport, label: 'Low EQ', points: [{ beat: 0, value: 0 }, { beat: 32, value: .7 }, { beat: 64, value: 1 }], onPointChange })
    expect(slider).toHaveValue('0.7')
    expect(view.container.querySelectorAll('[data-automation-segment]')).toHaveLength(2)
  })

  it('lets keyboard users choose and seek a waveform beat', async () => {
    const onSeek = vi.fn()
    const context = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    render(WaveformCanvas, { viewport, peaks: [], color: '#f00', onSeek })
    const waveform = screen.getByRole('button', { name: /Seek waveform, selected beat 16/ })
    await fireEvent.keyDown(waveform, { key: 'ArrowRight' })
    expect(waveform).toHaveAccessibleName(/selected beat 17/)
    await fireEvent.keyDown(waveform, { key: 'Enter' })
    expect(onSeek).toHaveBeenCalledWith(17)
    await fireEvent.keyDown(waveform, { key: 'End' })
    await fireEvent.keyDown(waveform, { key: ' ' })
    expect(onSeek).toHaveBeenLastCalledWith(48)
    context.mockRestore()
  })
})
