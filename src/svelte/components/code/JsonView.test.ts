import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'
import JsonView from './JsonView.svelte'

describe('JSON evidence view', () => {
  it('renders untrusted values as text and follows updated observations', async () => {
    const value = { effect: '<img src=x onerror=alert(1)>' }
    const { container, rerender } = render(JsonView, { value })
    expect(screen.getByRole('region', { name: 'JSON data' }).textContent).toBe(JSON.stringify(value, null, 2))
    expect(container.querySelector('img')).toBeNull()
    await rerender({ value: { effect: false } })
    expect(screen.getByRole('region').textContent).toBe(JSON.stringify({ effect: false }, null, 2))
  })
  it('retains a user-opened native disclosure when evidence updates', async () => {
    const { container, rerender } = render(JsonView, { label: 'Action receipts', value: [] })
    const details = container.querySelector('details')!
    expect(details.open).toBe(false)
    details.open = true
    await fireEvent(details, new Event('toggle'))
    await rerender({ label: 'Action receipts', value: [{ released: true }] })
    expect(details.open).toBe(true)
    expect(screen.getByRole('region', { name: 'Action receipts' }).textContent).toContain('"released": true')
  })
  it('supports initially expanded disclosures and distinguishes missing from invalid evidence', async () => {
    const { container, rerender } = render(JsonView, { label: 'State', expanded: true, value: undefined })
    expect(container.querySelector('details')?.open).toBe(true)
    expect(screen.getByText('JSON value unavailable.')).toBeInTheDocument()
    await rerender({ label: 'State', expanded: true, value: 1n })
    expect(screen.getByText('This value cannot be represented as JSON.')).toBeInTheDocument()
    expect(container.querySelector('code')).toBeNull()
  })
})
