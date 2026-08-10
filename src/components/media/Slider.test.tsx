import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Slider } from './Slider'
import { formatTime } from './formatTime'

/**
 * `Slider` is the only keyboard-accessible seek control in the library — the
 * waveform beside it is pointer-only and `aria-hidden` — so its key handling is
 * load-bearing for every media surface. It had no tests at all.
 */
describe('Slider keyboard interaction', () => {
  const setup = (value = 50, orientation: 'horizontal' | 'vertical' = 'horizontal') => {
    const onChange = vi.fn()
    render(
      <Slider value={value} onChange={onChange} aria-label="Seek" orientation={orientation} />,
    )
    return { onChange, slider: screen.getByRole('slider', { name: 'Seek' }) }
  }

  it.each([
    ['ArrowRight', 55],
    ['ArrowUp', 55],
    ['PageUp', 55],
    ['ArrowLeft', 45],
    ['ArrowDown', 45],
    ['PageDown', 45],
    ['Home', 0],
    ['End', 100],
  ])('%s moves to %i', (key, expected) => {
    const { onChange, slider } = setup()
    fireEvent.keyDown(slider, { key })
    expect(onChange).toHaveBeenCalledWith(expected)
  })

  it.each([
    [100, 'ArrowRight', 100],
    [0, 'ArrowLeft', 0],
  ])('at %i, %s clamps to %i rather than running past', (value, key, expected) => {
    const { onChange, slider } = setup(value)
    fireEvent.keyDown(slider, { key })
    expect(onChange).toHaveBeenCalledWith(expected)
  })

  it('ignores keys it does not own', () => {
    const { onChange, slider } = setup()
    fireEvent.keyDown(slider, { key: 'Enter' })
    fireEvent.keyDown(slider, { key: 'a' })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('exposes the value and orientation to assistive tech', () => {
    const { slider } = setup(42)
    expect(slider).toHaveAttribute('aria-valuenow', '42')
    expect(slider).toHaveAttribute('aria-valuemin', '0')
    expect(slider).toHaveAttribute('aria-valuemax', '100')
    expect(slider).toHaveAttribute('aria-orientation', 'horizontal')
    expect(slider).toHaveAttribute('tabindex', '0')
  })

  it('reports a vertical orientation', () => {
    const { slider } = setup(10, 'vertical')
    expect(slider).toHaveAttribute('aria-orientation', 'vertical')
  })

  it.each([
    [Number.NaN, '0'],
    [Number.POSITIVE_INFINITY, '0'],
    [-20, '0'],
    [140, '100'],
  ])('clamps a value of %s to %s', (value, expected) => {
    render(<Slider value={value} onChange={vi.fn()} aria-label="Volume" />)
    // `duration` is NaN until metadata loads and Infinity for live streams, so
    // a non-finite value reaching the track is routine rather than exceptional.
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', expected)
  })
})

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [9, '0:09'],
    [93, '1:33'],
    [214, '3:34'],
    [3599, '59:59'],
  ])('renders %i seconds as %s', (seconds, expected) => {
    expect(formatTime(seconds)).toBe(expected)
  })

  it('does not wrap minutes into hours', () => {
    // Documented behaviour, not an oversight: an hour-long recording reads
    // 70:00 rather than 1:10:00.
    expect(formatTime(4200)).toBe('70:00')
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])('guards %s', (value) => {
    expect(formatTime(value)).toBe('0:00')
  })
})
