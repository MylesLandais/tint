import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TimelineView } from './TimelineView'
import type { GraphSpan } from './projections/timeline'
import { documentOf, edge, node } from '../../test/graphBuilders'

const document = documentOf(
  [node('a', 'Task', 'Fetch'), node('b', 'Task', 'Judge')],
  [edge('a-b', 'a', 'b')],
)

const spans: readonly GraphSpan[] = [
  { id: 's1', nodeId: 'a', start: 0, end: 100, status: 'succeeded' },
  { id: 's2', nodeId: 'b', start: 100, end: 300, status: 'failed' },
]

describe('TimelineView', () => {
  it('renders a lane per node for the gantt variant', () => {
    render(<TimelineView document={document} spans={spans} variant="gantt" />)

    expect(screen.getByRole('list', { name: 'gantt timeline' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('positions a bar by its share of the domain', () => {
    const { container } = render(<TimelineView document={document} spans={spans} />)
    const bars = container.querySelectorAll<HTMLElement>('.tint-timeline__bar')

    // Domain is 0–300. The second span starts a third of the way in and covers
    // the remaining two thirds.
    expect(bars[1]?.style.left).toBe('33.33333333333333%')
    expect(bars[1]?.style.width).toBe('66.66666666666666%')
  })

  it('carries status onto the bar, so a failed span is not just another bar', () => {
    const { container } = render(<TimelineView document={document} spans={spans} />)
    const bars = container.querySelectorAll('.tint-timeline__bar')

    expect(bars[0]).toHaveAttribute('data-status', 'succeeded')
    expect(bars[1]).toHaveAttribute('data-status', 'failed')
  })

  it('says so when there is nothing to draw', () => {
    render(<TimelineView document={document} spans={[]} />)

    expect(screen.getByText('No spans for this graph.')).toBeInTheDocument()
  })

  it('selects the node a bar belongs to', () => {
    const onSelectionChange = vi.fn()
    render(
      <TimelineView
        document={document}
        spans={spans}
        onSelectionChange={onSelectionChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Judge/ }))

    expect([...(onSelectionChange.mock.calls[0]?.[0].nodeIds ?? [])]).toEqual(['b'])
  })

  it('offers drag handles only for the editable range variant', () => {
    const { container, rerender } = render(
      <TimelineView document={document} spans={spans} variant="gantt" onSpanChange={vi.fn()} />,
    )
    expect(container.querySelectorAll('.tint-timeline__handle')).toHaveLength(0)

    rerender(
      <TimelineView document={document} spans={spans} variant="range" onSpanChange={vi.fn()} />,
    )
    expect(container.querySelectorAll('.tint-timeline__handle')).toHaveLength(4)
  })

  it('does not offer handles when the host has nowhere to put the edit', () => {
    const { container } = render(
      <TimelineView document={document} spans={spans} variant="range" />,
    )

    expect(container.querySelectorAll('.tint-timeline__handle')).toHaveLength(0)
  })

  it('nudges an edge from the keyboard without inverting the interval', () => {
    const onSpanChange = vi.fn()
    render(
      <TimelineView
        document={document}
        spans={spans}
        variant="range"
        onSpanChange={onSpanChange}
      />,
    )

    // Domain is 300, the nudge is 2% of it.
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Fetch start' }), {
      key: 'ArrowRight',
    })
    expect(onSpanChange).toHaveBeenCalledWith('s1', { start: 6, end: 100 })

    // Pushing `start` past `end` clamps rather than producing a negative span.
    for (let i = 0; i < 50; i += 1) {
      fireEvent.keyDown(screen.getByRole('slider', { name: 'Fetch start' }), {
        key: 'ArrowRight',
      })
    }
    const [, last] = onSpanChange.mock.calls.at(-1) as [string, { start: number; end: number }]
    expect(last.start).toBeLessThanOrEqual(last.end)
  })

  it('indents nested trace spans', () => {
    const { container } = render(
      <TimelineView
        document={document}
        variant="trace"
        spans={[
          { id: 'root', nodeId: 'a', start: 0, end: 100 },
          { id: 'child', nodeId: 'b', start: 10, end: 50, parentSpanId: 'root' },
        ]}
      />,
    )
    const bars = container.querySelectorAll<HTMLElement>('.tint-timeline__bar')

    expect(bars[0]?.style.marginInlineStart).toBe('0rem')
    expect(bars[1]?.style.marginInlineStart).toBe('0.6rem')
  })
})
