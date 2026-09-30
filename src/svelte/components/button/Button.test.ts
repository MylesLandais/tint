import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import Button from './Button.svelte'

describe('Carbon backed Tint Button', () => {
  it('maps Tint size and variant while keeping native disabled behavior', async () => {
    const onclick = vi.fn()
    render(Button, {
      variant: 'danger', size: 'sm', disabled: true, 'aria-label': 'Delete', onclick,
    })
    const button = screen.getByRole('button', { name: 'Delete' })
    expect(button).toHaveClass('tint-button', 'bx--btn', 'bx--btn--danger', 'bx--btn--sm')
    expect(button).toHaveAttribute('data-variant', 'danger')
    expect(button).toHaveAttribute('data-size', 'sm')
    expect(button).toBeDisabled()
    await fireEvent.click(button)
    expect(onclick).not.toHaveBeenCalled()
  })
})
