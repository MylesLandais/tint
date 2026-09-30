import { fireEvent, render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ToastHarness from './ToastHarness.svelte'

afterEach(() => vi.useRealTimers())

describe('ToastProvider and useToast', () => {
  it('pushes an accessible notification, returns its id, and dismisses through Carbon close', async () => {
    const onPush = vi.fn()
    render(ToastHarness, { durationMs: 0, onPush })
    await fireEvent.click(screen.getByRole('button', { name: 'Push neutral' }))
    const toast = screen.getByRole('status')
    expect(toast).toHaveAttribute('data-tone', 'neutral')
    expect(toast).toHaveTextContent('Toast 1')
    expect(toast).toHaveTextContent('Ready to view')
    expect(onPush).toHaveBeenCalledWith(toast.getAttribute('data-toast-id'))
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('announces danger as urgent and keeps older toasts behind the visible limit', async () => {
    render(ToastHarness, { limit: 1, durationMs: 0 })
    await fireEvent.click(screen.getByRole('button', { name: 'Push neutral' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Push danger' }))
    const danger = screen.getByRole('alert')
    expect(danger).toHaveAttribute('data-tone', 'danger')
    expect(danger).toHaveTextContent('Toast 2')
    expect(screen.queryByText('Toast 1')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: 'Dismiss last' }))
    expect(screen.getByRole('status')).toHaveTextContent('Toast 1')
  })

  it('expires after its duration and pauses while hovered', async () => {
    vi.useFakeTimers()
    render(ToastHarness, { durationMs: 1000 })
    await fireEvent.click(screen.getByRole('button', { name: 'Push neutral' }))
    vi.advanceTimersByTime(400)
    expect(screen.getByRole('status')).toBeInTheDocument()
    await fireEvent.pointerEnter(screen.getByRole('region', { name: 'Notifications' }))
    vi.advanceTimersByTime(1000)
    expect(screen.getByRole('status')).toBeInTheDocument()
    await fireEvent.pointerLeave(screen.getByRole('region', { name: 'Notifications' }))
    vi.advanceTimersByTime(599)
    expect(screen.getByRole('status')).toBeInTheDocument()
    vi.advanceTimersByTime(1)
    await tick()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('continues expiry for hidden toasts and clears timers on unmount', async () => {
    vi.useFakeTimers()
    const view = render(ToastHarness, { limit: 1, durationMs: 1000 })
    await fireEvent.click(screen.getByRole('button', { name: 'Push neutral' }))
    vi.advanceTimersByTime(500)
    await fireEvent.click(screen.getByRole('button', { name: 'Push neutral' }))
    vi.advanceTimersByTime(500)
    await tick()
    expect(screen.queryByText('Toast 1')).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('Toast 2')
    expect(vi.getTimerCount()).toBeGreaterThan(0)
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
