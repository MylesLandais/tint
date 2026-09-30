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
