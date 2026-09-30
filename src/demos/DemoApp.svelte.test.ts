import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import DemoApp from './DemoApp.svelte'

describe('Svelte Tint Mock Lab', () => {
  it('keeps client scenarios and fixture policy state local to the host page', async () => {
    render(DemoApp)
    expect(screen.getByRole('heading', { name: /promises, clients, and host-owned contracts/i })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByTestId('client-status')).toHaveTextContent('ready'))
    await fireEvent.click(screen.getByRole('button', { name: 'Degraded' }))
    await waitFor(() => expect(screen.getByTestId('client-status')).toHaveTextContent('degraded'))
    expect(screen.getByText('storage')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Send typed request' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('200 · contract accepted'))
    const toggle = screen.getByRole('button', { name: /Disable rule|Enable rule/ })
    const initial = toggle.textContent
    await fireEvent.click(toggle)
    expect(toggle.textContent).not.toBe(initial)
    await fireEvent.click(screen.getByRole('button', { name: 'Reset fixtures' }))
    expect(toggle.textContent).toBe(initial)
  })
})
