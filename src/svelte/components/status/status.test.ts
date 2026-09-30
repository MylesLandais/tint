import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import Skeleton from './Skeleton.svelte'
import EmptyState from './EmptyState.svelte'
import ErrorState from './ErrorState.svelte'
import ConnectionStatus from './ConnectionStatus.svelte'

describe('Svelte status primitives', () => {
  it('renders a named skeleton without motion-dependent text', () => {
    const view = render(Skeleton, { lines: 2, label: 'Loading releases' })
    expect(screen.getByRole('status', { name: 'Loading releases' })).toBeInTheDocument()
    expect(view.container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
  })

  it('keeps empty and error copy accessible', () => {
    render(EmptyState, { title: 'No releases', description: 'Try another filter.' })
    expect(screen.getByRole('heading', { name: 'No releases' })).toBeInTheDocument()
    render(ErrorState, { title: 'Could not load' })
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load')
  })

  it('offers retry only for recoverable connection states', async () => {
    const onRetry = vi.fn()
    const view = render(ConnectionStatus, { state: 'offline', onRetry })
    expect(screen.getByRole('status')).toHaveTextContent('Offline')
    await fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledOnce()
    await view.rerender({ state: 'online', onRetry })
    expect(screen.getByRole('status')).toHaveTextContent('Online')
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
  })
})
