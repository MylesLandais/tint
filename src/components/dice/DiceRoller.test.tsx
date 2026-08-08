import { render, screen } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DiceRoller } from './DiceRoller'
import type { DiceKind } from './types'

describe('DiceRoller', () => {
  it('shows the settled value when not rolling', () => {
    render(<DiceRoller kind="d20" value={14} />)
    expect(screen.getByRole('status', { name: 'Rolled 14' })).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
  })

  it('reports intent without picking the result itself', () => {
    const onRoll = vi.fn()
    render(<DiceRoller kind="d6" value={3} onRoll={onRoll} />)

    fireEvent.click(screen.getByRole('button', { name: /roll/i }))

    expect(onRoll).toHaveBeenCalledTimes(1)
  })

  it('disables the trigger and announces rolling while in flight', () => {
    render(<DiceRoller kind="d10" value={7} rolling />)

    expect(screen.getByRole('status', { name: 'Rolling' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /roll/i })).toBeDisabled()
  })

  it.each<DiceKind>(['d6', 'd10', 'd20'])('renders %s without crashing', (kind) => {
    render(<DiceRoller kind={kind} value={1} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('only overlays a numeral for the custom d10/d20 glyphs, not d6', () => {
    const { container: d6 } = render(<DiceRoller kind="d6" value={4} />)
    const { container: d20 } = render(<DiceRoller kind="d20" value={4} />)

    expect(d6.querySelector('[data-dice-roller] span')).not.toBeInTheDocument()
    expect(d20.querySelector('[data-dice-roller] span')).toBeInTheDocument()
  })
})

describe('DiceRoller rolling animation', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('settles on the controlled value once rolling flips back off', () => {
    const { rerender } = render(<DiceRoller kind="d6" value={2} rolling />)

    vi.advanceTimersByTime(400)
    expect(screen.getByRole('status', { name: 'Rolling' })).toBeInTheDocument()

    rerender(<DiceRoller kind="d6" value={5} rolling={false} />)
    expect(screen.getByRole('status', { name: 'Rolled 5' })).toBeInTheDocument()
  })

  it('re-animates on a reroll that lands on the same face', () => {
    const { rerender } = render(<DiceRoller kind="d6" value={6} rolling={false} />)
    expect(screen.getByRole('status', { name: 'Rolled 6' })).toBeInTheDocument()

    rerender(<DiceRoller kind="d6" value={6} rolling />)
    expect(screen.getByRole('status', { name: 'Rolling' })).toBeInTheDocument()

    rerender(<DiceRoller kind="d6" value={6} rolling={false} />)
    expect(screen.getByRole('status', { name: 'Rolled 6' })).toBeInTheDocument()
  })
})
