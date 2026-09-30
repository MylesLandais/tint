import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import DiceRoller from './DiceRoller.svelte'

describe('DiceRoller', () => {
  it('reports roll intent while leaving the result with the host', async () => {
    const onRoll = vi.fn()
    const view = render(DiceRoller, { kind: 'd20', value: 7, onRoll })

    expect(screen.getByRole('status', { name: 'Rolled 7' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Roll' }))
    expect(onRoll).toHaveBeenCalledOnce()
    expect(screen.getByRole('status', { name: 'Rolled 7' })).toBeInTheDocument()

    await view.rerender({ kind: 'd20', value: 7, rolling: true, onRoll })
    expect(screen.getByRole('status', { name: 'Rolling' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Roll' })).toBeDisabled()

    await view.rerender({ kind: 'd20', value: 13, rolling: false, onRoll })
    expect(screen.getByRole('status', { name: 'Rolled 13' })).toBeInTheDocument()
    expect(screen.getByText('13')).toBeInTheDocument()
  })

  it.each(['d6', 'd10', 'd20'] as const)('renders %s with a named status', (kind) => {
    render(DiceRoller, { kind, value: 4 })
    expect(screen.getByRole('status', { name: 'Rolled 4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Roll' })).toBeEnabled()
  })

  it('uses a numeral overlay only for custom d10/d20 glyphs', () => {
    const d6 = render(DiceRoller, { kind: 'd6', value: 4 })
    expect(d6.container.querySelector('.face')).toBeNull()
    d6.unmount()
    const d20 = render(DiceRoller, { kind: 'd20', value: 4 })
    expect(d20.container.querySelector('.face')).toHaveTextContent('4')
  })
})
