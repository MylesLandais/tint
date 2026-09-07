import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlaybackQueue } from './PlaybackQueue'

const items = [
  { id: 'one', title: 'First scene', subtitle: 'Studio A', durationSeconds: 90 },
  { id: 'two', title: 'Second scene', subtitle: 'Studio B', durationSeconds: 180 },
  { id: 'three', title: 'Third scene' },
] as const

describe('PlaybackQueue', () => {
  it('marks the current item and separates played items from the remainder', () => {
    render(
      <PlaybackQueue
        items={items}
        currentItemId="two"
        status="paused"
        positionSeconds={30}
      />,
    )

    expect(screen.getByText('Played')).toBeInTheDocument()
    expect(screen.getByText('Paused')).toBeInTheDocument()
    expect(screen.getAllByText('Up next')).toHaveLength(2)
    expect(screen.getByText('0:30 / 3:00')).toBeInTheDocument()
    expect(screen.getByText('3 items')).toBeInTheDocument()
  })

  it('emits the selected item and index', () => {
    const onSelect = vi.fn()
    render(<PlaybackQueue items={items} currentItemId="one" onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('button', { name: /second scene/i }))
    expect(onSelect).toHaveBeenCalledWith(items[1], 1)
  })

  it('renders source links when the queue is read-only', () => {
    render(<PlaybackQueue items={[{ id: 'one', title: 'Source scene', href: '/scenes/1' }]} />)
    expect(screen.getByRole('link', { name: /source scene/i })).toHaveAttribute('href', '/scenes/1')
  })

  it('renders an explicit empty state', () => {
    render(<PlaybackQueue items={[]} emptyLabel="No browser queue found." />)
    expect(screen.getByText('No browser queue found.')).toBeInTheDocument()
  })
})
