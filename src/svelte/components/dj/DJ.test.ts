import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import AnalysisQueue from './AnalysisQueue.svelte'
import DualWaveform from './DualWaveform.svelte'
import TransitionAuditionControls from './TransitionAuditionControls.svelte'
import TransitionPresetPicker from './TransitionPresetPicker.svelte'

describe('Svelte DJ controls', () => {
  it('keeps preset selection controlled and reports intent', async () => {
    const onChange = vi.fn()
    const view = render(TransitionPresetPicker, { value: 'long-bass-swap', onChange })
    const first = screen.getByRole('radio', { name: 'Long bass swap' })
    const second = screen.getByRole('radio', { name: 'Filter and echo exit' })
    expect(first).toBeChecked()
    await fireEvent.click(second)
    expect(onChange).toHaveBeenCalledWith('filter-echo-exit')
    expect(first).toBeChecked()
    await view.rerender({ value: 'filter-echo-exit', onChange })
    expect(second).toBeChecked()
  })

  it('announces audition state and keeps action availability in sync', async () => {
    const onAudition = vi.fn()
    const onStop = vi.fn()
    const view = render(TransitionAuditionControls, { state: 'idle', onAudition, onStop })
    await fireEvent.click(screen.getByRole('button', { name: 'Audition transition' }))
    expect(onAudition).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Stop audition' })).toBeDisabled()
    await view.rerender({ state: 'playing', onAudition, onStop })
    expect(screen.getByRole('status')).toHaveTextContent('Audition playing')
    await fireEvent.click(screen.getByRole('button', { name: 'Stop audition' }))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('shows analysis progress and retries failed tracks', async () => {
    const onRetry = vi.fn()
    render(AnalysisQueue, { items: [
      { id: 'ready', fileName: 'first.wav', status: 'ready', durationSeconds: 60 },
      { id: 'failed', fileName: 'second.wav', status: 'error', error: 'Decode failed' },
    ], onRetry })
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2 tracks ready')
    expect(screen.getByText('1:00')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Decode failed')
    await fireEvent.click(screen.getByRole('button', { name: 'Retry second.wav' }))
    expect(onRetry).toHaveBeenCalledWith('failed')
  })

  it('places beat lines and clipped transition using the viewport and reports seek beats', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const onSeek = vi.fn()
    const viewport = { totalBeats: 128, widthPixels: 320, pixelsPerBeat: 10, scrollBeat: 16 }
    const { container } = render(DualWaveform, {
      viewport,
      outgoing: { label: 'Outgoing', peaks: [.2, .8], color: '#8b5cf6' },
      incoming: { label: 'Incoming', peaks: [.1, .9], color: '#22c55e' },
      transition: { startBeat: 8, endBeat: 24, label: 'Blend' },
      beatsPerBar: 4, onSeek,
    })
    expect(container.querySelector('[data-beat="20"]')).toHaveStyle({ left: '40px' })
    expect(container.querySelector('[data-beat="20"]')).toHaveAttribute('data-bar-line', 'true')
    expect(screen.getByRole('region', { name: 'Blend' })).toHaveStyle({ left: '0px', width: '80px' })
    const seek = screen.getByRole('slider', { name: 'Seek mix timeline' })
    expect(seek).toHaveAttribute('aria-valuetext', 'Beat 16 of 128')
    const canvas = container.querySelector('canvas')!
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 320 } as DOMRect)
    await fireEvent.click(canvas, { clientX: 100 })
    expect(onSeek).toHaveBeenCalledWith(26)
    expect(seek).toHaveAttribute('aria-valuetext', 'Beat 26 of 128')
    await fireEvent.input(seek, { target: { value: '27' } })
    expect(onSeek).toHaveBeenCalledWith(27)
    expect(seek).toHaveAttribute('aria-valuetext', 'Beat 27 of 128')
  })
})
