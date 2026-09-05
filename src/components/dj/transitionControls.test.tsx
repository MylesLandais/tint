import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TransitionAuditionControls } from './TransitionAuditionControls'
import { TransitionPresetPicker } from './TransitionPresetPicker'

describe('TransitionPresetPicker', () => {
  it('is controlled and reports preset intent', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <TransitionPresetPicker value="long-bass-swap" onChange={onChange} />,
    )

    expect(screen.getByRole('radio', { name: 'Long bass swap' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: 'Filter and echo exit' }))
    expect(onChange).toHaveBeenCalledWith('filter-echo-exit')
    expect(screen.getByRole('radio', { name: 'Long bass swap' })).toBeChecked()

    rerender(<TransitionPresetPicker value="filter-echo-exit" onChange={onChange} />)
    expect(screen.getByRole('radio', { name: 'Filter and echo exit' })).toBeChecked()
  })
})

describe('TransitionAuditionControls', () => {
  it('reports audition and stop intent while announcing engine state', () => {
    const onAudition = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(
      <TransitionAuditionControls state="idle" onAudition={onAudition} onStop={onStop} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Audition transition' }))
    expect(onAudition).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Stop audition' })).toBeDisabled()

    rerender(
      <TransitionAuditionControls state="playing" onAudition={onAudition} onStop={onStop} />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Audition playing')
    expect(screen.getByRole('button', { name: 'Audition transition' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Stop audition' }))
    expect(onStop).toHaveBeenCalledOnce()
  })

  it('exposes unavailable and error capability states', () => {
    const { rerender } = render(
      <TransitionAuditionControls
        state="unavailable"
        unavailableReason="Web Audio is unavailable"
        onAudition={vi.fn()}
        onStop={vi.fn()}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Web Audio is unavailable')
    expect(screen.getByRole('button', { name: 'Audition transition' })).toBeDisabled()

    rerender(
      <TransitionAuditionControls
        state="error"
        error="Audio decoding failed"
        onAudition={vi.fn()}
        onStop={vi.fn()}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Audio decoding failed')
  })
})
