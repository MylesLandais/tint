import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConnectionStatus, ErrorState, Skeleton } from './index'

describe('status components', () => {
  it('announces connection state and retry intent', () => {
    const retry = vi.fn()
    render(<ConnectionStatus state="offline" onRetry={retry} />)
    expect(screen.getByRole('status')).toHaveTextContent('Offline')
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it('renders accessible loading and failure states', () => {
    const retry = vi.fn()
    const view = render(<Skeleton label="Loading people" />)
    expect(screen.getByRole('status', { name: 'Loading people' })).toHaveClass('motion-reduce:animate-none')
    view.rerender(<ErrorState title="Could not load" onRetry={retry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
