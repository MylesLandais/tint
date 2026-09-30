import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { emptySelection, type GraphDocument, type GraphSelection } from '../../../core/graph'
import { demoGraphDocument } from '../../../docs/graph/fixtures/demoDocument'
import { documentOf, edge, node } from '../../../test/graphBuilders'
import InteractiveGraphView from './InteractiveGraphView.svelte'
import CustomNodeFixture from './CustomNodeFixture.svelte'

const graphDocument: GraphDocument = documentOf([
  { ...node('a', 'Task', 'Fetch'), position: { x: 0, y: 0 } },
  { ...node('b', 'Task', 'Judge'), position: { x: 280, y: 0 } },
], [edge('a-b', 'a', 'b')])

describe('Svelte InteractiveGraphView', () => {
  it('renders accessible canvas, nodes, edges, and inspector', () => {
    render(InteractiveGraphView, { document: graphDocument })
    expect(screen.getByRole('application', { name: 'Graph canvas' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Graph edges' })).toContainElement(screen.getByRole('button', { name: /Edge a.out to b.in/ }))
    expect(screen.getByRole('complementary', { name: 'Graph inspector' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Fetch \(Task, ready\)/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edge a.out to b.in/ })).toBeInTheDocument()
  })

  it('reports selection through both callbacks and renders the inspector fields', () => {
    const onSelectionChange = vi.fn()
    const onCommand = vi.fn()
    render(InteractiveGraphView, { document: graphDocument, onSelectionChange, onCommand })
    fireEvent.click(screen.getByRole('button', { name: /Fetch \(Task, ready\)/ }))
    expect(onSelectionChange).toHaveBeenCalledWith(expect.objectContaining({ primary: { kind: 'node', id: 'a' } }))
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ type: 'selection.replace' }))
    expect(screen.getByRole('complementary', { name: 'Graph inspector' })).toHaveTextContent('Fetch')
    fireEvent.click(screen.getByRole('button', { name: /Edge a.out to b.in/ }))
    expect(screen.getByRole('complementary', { name: 'Graph inspector' })).toHaveTextContent('a.out')
  })

  it('keeps controlled selection owned by the host', async () => {
    const onSelectionChange = vi.fn()
    const { rerender } = render(InteractiveGraphView, { document: graphDocument, selection: emptySelection(), onSelectionChange })
    fireEvent.click(screen.getByRole('button', { name: /Fetch \(Task, ready\)/ }))
    const next = onSelectionChange.mock.calls[0]?.[0] as GraphSelection
    expect([...next.nodeIds]).toEqual(['a'])
    expect(screen.getByRole('complementary', { name: 'Graph inspector' })).toHaveTextContent('Nothing selected')
    await rerender({ document: graphDocument, selection: next, onSelectionChange })
    expect(screen.getByRole('complementary', { name: 'Graph inspector' })).toHaveTextContent('Fetch')
  })

  it('moves and deletes a node through one controlled command route', () => {
    const onCommand = vi.fn()
    const onDocumentChange = vi.fn()
    render(InteractiveGraphView, { document: graphDocument, onCommand, onDocumentChange })
    const fetch = screen.getByRole('button', { name: /Fetch \(Task, ready\)/ })
    fireEvent.keyDown(fetch, { key: 'ArrowRight' })
    expect(onCommand).toHaveBeenCalledWith({ type: 'node.move', nodeIds: ['a'], positions: { a: { x: 10, y: 0 } } })
    expect(onDocumentChange.mock.calls[0]?.[0]).toMatchObject({ revision: 'r2' })
    fireEvent.keyDown(fetch, { key: 'Delete' })
    expect(onCommand).toHaveBeenCalledWith({ type: 'entity.delete', entities: [{ kind: 'node', id: 'a' }] })
    expect(onDocumentChange.mock.calls[1]?.[0].nodes.map((item: { id: string }) => item.id)).toEqual(['b'])
  })

  it('connects ports and emits pan and zoom viewport changes without revising the graph', () => {
    const onCommand = vi.fn()
    const onViewportChange = vi.fn()
    const onDocumentChange = vi.fn()
    render(InteractiveGraphView, { document: graphDocument, onCommand, onViewportChange, onDocumentChange })
    fireEvent.click(screen.getByRole('button', { name: 'Fetch out output' }))
    fireEvent.click(screen.getByRole('button', { name: 'Judge in input' }))
    expect(onCommand).toHaveBeenCalledWith({ type: 'edge.connect', source: { nodeId: 'a', portId: 'out' }, target: { nodeId: 'b', portId: 'in' } })

    const canvas = screen.getByRole('application', { name: 'Graph canvas' })
    fireEvent.pointerDown(canvas, { pointerId: 1, button: 0, clientX: 20, clientY: 20 })
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 60, clientY: 40 })
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 60, clientY: 40 })
    expect(onViewportChange).toHaveBeenCalledTimes(1)
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ type: 'viewport.set' }))
    expect(onDocumentChange.mock.calls.at(-1)?.[0].revision).toBe('r1')
    fireEvent.wheel(canvas, { deltaY: -100, clientX: 50, clientY: 40 })
    expect(onViewportChange).toHaveBeenCalledTimes(2)
    expect(onViewportChange.mock.calls[1]?.[0].zoom).toBeGreaterThan(onViewportChange.mock.calls[0]?.[0].zoom)
  })

  it('uses the Svelte FormLayout for the same schema-driven inspector fields', () => {
    const selection: GraphSelection = { ...emptySelection(), nodeIds: new Set(['n-trigger']), primary: { kind: 'node', id: 'n-trigger' } }
    render(InteractiveGraphView, { document: demoGraphDocument, selection })
    expect(screen.getByLabelText('Event')).toHaveValue('webhook.intake')
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
    expect(screen.getByText('scripts/enrich-entities.ts')).toBeInTheDocument()
  })

  it('keeps read-only nodes selectable while suppressing edits', () => {
    const onCommand = vi.fn()
    render(InteractiveGraphView, { document: graphDocument, readonly: true, onCommand })
    const fetch = screen.getByRole('button', { name: /Fetch \(Task, ready\)/ })
    fireEvent.click(fetch)
    expect(screen.getByRole('complementary', { name: 'Graph inspector' })).toHaveTextContent('Fetch')
    fireEvent.keyDown(fetch, { key: 'ArrowRight' })
    fireEvent.keyDown(fetch, { key: 'Delete' })
    expect(onCommand).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'node.move' }))
    expect(onCommand).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'entity.delete' }))
    expect(screen.getByRole('button', { name: 'Fetch out output' })).toBeDisabled()
  })

  it('keeps custom Svelte nodes selectable, focusable, and keyboard movable', async () => {
    const onSelectionChange = vi.fn()
    const onCommand = vi.fn()
    render(InteractiveGraphView, {
      document: graphDocument,
      nodeRenderers: new Map([['Task', CustomNodeFixture]]),
      onSelectionChange, onCommand,
    })
    const fetch = screen.getByRole('button', { name: /Fetch \(Task, ready\)/ })
    expect(screen.getAllByTestId('custom-node')[0]).toHaveAttribute('data-focused', 'false')
    await fireEvent.focusIn(fetch)
    expect(screen.getAllByTestId('custom-node')[0]).toHaveAttribute('data-focused', 'true')
    await fireEvent.click(fetch)
    expect(onSelectionChange).toHaveBeenCalledWith(expect.objectContaining({ primary: { kind: 'node', id: 'a' } }))
    await fireEvent.keyDown(fetch, { key: 'ArrowRight' })
    expect(onCommand).toHaveBeenCalledWith({ type: 'node.move', nodeIds: ['a'], positions: { a: { x: 10, y: 0 } } })
    const count = onSelectionChange.mock.calls.length
    await fireEvent.click(screen.getAllByRole('button', { name: 'Inner action' })[0]!)
    expect(onSelectionChange).toHaveBeenCalledTimes(count)
  })

  it('falls back to focus-trapped theater mode when fullscreen is unavailable', async () => {
    const { container } = render(InteractiveGraphView, { document: graphDocument })
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
    await waitFor(() => expect(container.querySelector('[data-tint-graph-view]')).toHaveAttribute('data-theater', 'true'))
    expect(screen.getByRole('dialog', { name: 'Graph, fullscreen' })).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(container.querySelector('[data-tint-graph-view]')).toHaveAttribute('data-fullscreen', 'false')
  })
})
