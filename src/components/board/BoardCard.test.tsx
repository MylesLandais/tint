import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BoardCard } from './BoardCard'
import type { BoardCard as BoardCardModel } from './contracts'

const card: BoardCardModel = {
  id: 'card-1',
  title: 'Pipeline',
  laneId: 'now',
  kind: 'graph',
  preview: {
    kicker: '12 nodes · 18 edges',
    metrics: ['ready'],
  },
}

describe('BoardCard', () => {
  it('renders kind, title, and kicker', () => {
    render(<BoardCard card={card} />)
    expect(screen.getByText('GRAPH')).toBeInTheDocument()
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
    expect(screen.getByText('12 nodes · 18 edges')).toBeInTheDocument()
    expect(screen.getByText('ready')).toBeInTheDocument()
  })

  it('marks the selected card', () => {
    const { container } = render(<BoardCard card={card} selected />)
    expect(container.querySelector('[data-selected]')).toBeTruthy()
  })

  it('reports selection on click and keyboard', () => {
    const onSelect = vi.fn()
    render(<BoardCard card={card} onSelect={onSelect} />)

    const button = screen.getByRole('button', { name: /Pipeline/i })
    fireEvent.click(button)
    expect(onSelect).toHaveBeenCalledWith('card-1')

    onSelect.mockClear()
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('card-1')

    onSelect.mockClear()
    fireEvent.keyDown(button, { key: ' ' })
    expect(onSelect).toHaveBeenCalledWith('card-1')
  })
})
