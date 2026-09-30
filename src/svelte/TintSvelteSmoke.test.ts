import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import TintSvelteSmoke from './TintSvelteSmoke.svelte'

describe('TintSvelteSmoke', () => {
  it('renders the supplied label and pressed state', () => {
    render(TintSvelteSmoke, { label: 'Ready', active: true })
    expect(screen.getByRole('button', { name: 'Ready' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('defaults to inactive', () => {
    render(TintSvelteSmoke, { label: 'Idle' })
    expect(screen.getByRole('button', { name: 'Idle' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onactivate when clicked', async () => {
    const onactivate = vi.fn()
    render(TintSvelteSmoke, { label: 'Go', onactivate })
    await fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onactivate).toHaveBeenCalledTimes(1)
  })
})
