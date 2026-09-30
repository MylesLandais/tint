import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import PlaybackQueue from './PlaybackQueue.svelte'

const items = [
  { id: 'one', title: 'First scene', subtitle: 'Studio A', durationSeconds: 90 },
  { id: 'two', title: 'Second scene', subtitle: 'Studio B', durationSeconds: 180 },
  { id: 'three', title: 'Third scene', subtitle: 'Studio C' },
] as const

describe('Svelte PlaybackQueue', () => {
  it('derives status and time from host-owned queue state', () => {
    render(PlaybackQueue, { items, currentItemId: 'two', status: 'paused', positionSeconds: 30 })
    expect(screen.getByText('Played')).toBeInTheDocument()
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getByText('Up next')).toBeInTheDocument()
    expect(screen.getByText('0:30 / 3:00')).toBeInTheDocument()
  })

  it('emits selection intent without owning the current item', async () => {
    const onSelect = vi.fn()
    render(PlaybackQueue, { items, currentItemId: 'one', onSelect })
    await fireEvent.click(screen.getByRole('button', { name: /second scene/i }))
    expect(onSelect).toHaveBeenCalledWith(items[1], 1)
    expect(screen.getByRole('button', { name: /first scene/i })).toHaveAttribute('aria-current', 'true')
  })

  it('keeps links and an empty state for read-only queues', () => {
    const { unmount } = render(PlaybackQueue, { items: [{ id: 'one', title: 'Scene', href: '/scenes/1' }] })
    expect(screen.getByRole('link', { name: /scene/i })).toHaveAttribute('href', '/scenes/1')
    unmount()
    render(PlaybackQueue, { items: [], emptyLabel: 'No browser queue found.' })
    expect(screen.getByText('No browser queue found.')).toBeInTheDocument()
  })
})
