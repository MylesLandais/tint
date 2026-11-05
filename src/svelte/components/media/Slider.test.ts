import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import Slider from './Slider.svelte'

describe('Svelte media slider', () => {
  it('clamps its accessible value and emits keyboard seek intent', async () => {
    const onChange = vi.fn()
    render(Slider, { value: 98, onChange, 'aria-label': 'Seek Track' })
    const slider = screen.getByRole('slider', { name: 'Seek Track' })
    expect(slider).toHaveAttribute('aria-valuenow', '98')
    await fireEvent.keyDown(slider, { key: 'ArrowRight' })
    await fireEvent.keyDown(slider, { key: 'Home' })
    expect(onChange).toHaveBeenNthCalledWith(1, 100)
    expect(onChange).toHaveBeenNthCalledWith(2, 0)
  })

  it('names the bottom-up vertical control and guards non-finite values', () => {
    render(Slider, { value: Number.NaN, onChange: vi.fn(), 'aria-label': 'Volume', orientation: 'vertical' })
    expect(screen.getByRole('slider', { name: 'Volume' })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('slider')).toHaveAttribute('aria-orientation', 'vertical')
  })
})


describe('shared playback commits', () => {
  it('commits held arrows once on release, cancels Escape and ignores repeated Page keys', async () => {
    const onCommit = vi.fn(), onChange = vi.fn()
    render(Slider, { value: 20, onChange, onCommit, 'aria-label': 'Shared seek' })
    const slider = screen.getByRole('slider', { name: 'Shared seek' })
    await fireEvent.keyDown(slider, { key: 'ArrowRight' })
    await fireEvent.keyDown(slider, { key: 'ArrowRight', repeat: true })
    expect(onCommit).not.toHaveBeenCalled()
    await fireEvent.keyUp(slider, { key: 'ArrowRight' })
    expect(onCommit).toHaveBeenCalledExactlyOnceWith(30)
    await fireEvent.keyDown(slider, { key: 'ArrowLeft' })
    await fireEvent.keyDown(slider, { key: 'Escape' })
    await fireEvent.keyUp(slider, { key: 'ArrowLeft' })
    expect(onCommit).toHaveBeenCalledTimes(1)
    await fireEvent.keyDown(slider, { key: 'PageUp' })
    await fireEvent.keyDown(slider, { key: 'PageUp', repeat: true })
    expect(onCommit).toHaveBeenCalledTimes(2)
  })
  it('does not commit on focus loss or an unchanged Home action', async () => {
    const onCommit = vi.fn()
    render(Slider, { value: 0, onChange: vi.fn(), onCommit, 'aria-label': 'Cancel seek' })
    const slider = screen.getByRole('slider')
    await fireEvent.keyDown(slider, { key: 'Home' })
    await fireEvent.keyDown(slider, { key: 'ArrowRight' })
    await fireEvent.blur(slider)
    await fireEvent.keyUp(slider, { key: 'ArrowRight' })
    expect(onCommit).not.toHaveBeenCalled()
  })
})
