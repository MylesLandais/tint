import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { type GraphSpan } from '../../../core/graph'
import { documentOf, edge, node } from '../../../test/graphBuilders'
import ForceGraphView from './ForceGraphView.svelte'
import TimelineView from './TimelineView.svelte'

const document = documentOf([
  node('a', 'Task', 'Fetch'), node('b', 'Task', 'Judge'),
], [edge('a-b', 'a', 'b', 'out', 'in', 'depends_on')])
const spans: readonly GraphSpan[] = [
  { id: 's1', nodeId: 'a', start: 0, end: 100, status: 'succeeded' },
  { id: 's2', nodeId: 'b', start: 100, end: 300, status: 'failed' },
]

describe('Svelte graph projections', () => {
  it('renders force nodes and edges with status and reports keyboard selection', () => {
    const onCommand = vi.fn()
    const onSelectionChange = vi.fn()
    const { container } = render(ForceGraphView, { document, static: true,
      runtimeByNodeId: new Map([['a', { status: 'failed' as const }]]), onCommand, onSelectionChange })
    expect(container.querySelectorAll('.edge')).toHaveLength(1)
    expect(container.querySelector('.edge')).toHaveAttribute('data-kind', 'depends_on')
    fireEvent.keyDown(screen.getByRole('button', { name: /Fetch \(Task, failed\)/ }), { key: 'Enter' })
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ type: 'selection.replace' }))
    expect([...(onSelectionChange.mock.calls[0]?.[0].nodeIds ?? [])]).toEqual(['a'])
  })

  it('renders the timeline lanes, status, and only range handles when editable', async () => {
    const onSpanChange = vi.fn()
    const { container, rerender } = render(TimelineView, { document, spans, variant: 'gantt', onSpanChange })
    expect(screen.getByRole('list', { name: 'gantt timeline' })).toBeInTheDocument()
    expect(container.querySelectorAll('.bar')).toHaveLength(2)
    expect(container.querySelector('.bar[data-status="failed"]')).toBeInTheDocument()
    expect(container.querySelectorAll('.handle')).toHaveLength(0)
    await rerender({ document, spans, variant: 'range', onSpanChange })
    expect(container.querySelectorAll('.handle')).toHaveLength(4)
  })

  it('nudges an editable range without inverting it and selects its node', () => {
    const onSpanChange = vi.fn()
    const onSelectionChange = vi.fn()
    render(TimelineView, { document, spans, variant: 'range', onSpanChange, onSelectionChange })
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Fetch start' }), { key: 'ArrowRight' })
    expect(onSpanChange).toHaveBeenCalledWith('s1', { start: 6, end: 100 })
    fireEvent.click(screen.getByRole('button', { name: /Judge/ }))
    expect([...(onSelectionChange.mock.calls[0]?.[0].nodeIds ?? [])]).toEqual(['b'])
  })
})
