import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import Panel from './Panel.svelte'

describe('controlled Panel', () => {
  it('reports intent while leaving the supplied state unchanged', async () => {
    const onExpandedChange = vi.fn()
    const { container } = render(Panel, { title: 'Details', expanded: false, onExpandedChange })
    const toggle = screen.getByRole('button', { name: 'Details' })
    const body = container.querySelector('[data-panel-body]')!
    expect(body).toHaveAttribute('hidden')
    await fireEvent.click(toggle)
    expect(onExpandedChange).toHaveBeenCalledWith(true)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(body).toHaveAttribute('hidden')
  })
})
