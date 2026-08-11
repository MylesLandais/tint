import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InteractiveGraphView } from './InteractiveGraphView'
import { demoGraphDocument } from '../../docs/graph/fixtures/demoDocument'
import {
  handleId,
  portIdFromHandle,
  selectionFromFlow,
  toFlowEdges,
  toFlowNodes,
} from './adapter/mappers'
import { createDefaultNodeRegistry } from './nodes/defaultRegistry'

describe('graph mappers', () => {
  it('maps the demo document into flow nodes and edges', () => {
    const nodes = toFlowNodes(demoGraphDocument)
    const edges = toFlowEdges(demoGraphDocument)

    expect(nodes).toHaveLength(demoGraphDocument.nodes.length)
    expect(edges).toHaveLength(demoGraphDocument.edges.length)
    expect(nodes.every((node) => node.type === 'tint')).toBe(true)
    expect(edges[0]?.source).toBe('n-trigger')
    expect(edges[0]?.sourceHandle).toBe(handleId('out:output', 'source'))
  })

  /**
   * xyflow identifies a handle by id alone. A `'bidirectional'` port renders as
   * both a target and a source, and both carried the bare `port.id` — so the two
   * were indistinguishable and a connection landing on one could resolve to the
   * other. The document's own `portId` must survive the round trip untouched.
   */
  it('gives each side of a bidirectional port a distinct handle', () => {
    const source = handleId('io:bidirectional', 'source')
    const target = handleId('io:bidirectional', 'target')

    expect(source).not.toBe(target)
    expect(portIdFromHandle(source)).toBe('io:bidirectional')
    expect(portIdFromHandle(target)).toBe('io:bidirectional')
  })

  it('leaves an unsuffixed handle alone, and survives an empty one', () => {
    expect(portIdFromHandle('out:output')).toBe('out:output')
    expect(portIdFromHandle(null)).toBe('')
  })

  it('builds selection from selected flow elements', () => {
    const nodes = toFlowNodes(demoGraphDocument).map((node, index) => ({
      ...node,
      selected: index === 0,
    }))
    const edges = toFlowEdges(demoGraphDocument)
    const selection = selectionFromFlow(nodes, edges)

    expect(selection.nodeIds.has('n-trigger')).toBe(true)
    expect(selection.primary).toEqual({ kind: 'node', id: 'n-trigger' })
  })
})

describe('default node registry', () => {
  it('registers trigger, action, script, and ontology kinds', () => {
    const registry = createDefaultNodeRegistry()
    expect(registry.require('trigger').displayName).toBe('Trigger')
    expect(registry.require('script').category).toBe('scripting')
    expect(registry.get('missing')).toBeUndefined()
  })
})

describe('InteractiveGraphView', () => {
  afterEach(() => {
    Reflect.deleteProperty(HTMLElement.prototype, 'requestFullscreen')
  })

  it('renders the canvas and inspector chrome', () => {
    render(<InteractiveGraphView document={demoGraphDocument} />)

    expect(screen.getByRole('application', { name: 'Graph canvas' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Graph inspector' })).toBeInTheDocument()
    expect(screen.getByText('Webhook received')).toBeInTheDocument()
    expect(screen.getByText('Enrich entities')).toBeInTheDocument()
    expect(screen.getByText('Score candidates')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument()
  })

  it('shows script source refs without embedding an editor runtime', () => {
    render(<InteractiveGraphView document={demoGraphDocument} />)

    expect(screen.getByText('scripts/enrich-entities.ts')).toBeInTheDocument()
    expect(screen.getByText('scripts/score.py')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('enters theater fullscreen when the Fullscreen API rejects', async () => {
    HTMLElement.prototype.requestFullscreen = vi.fn().mockRejectedValue(new Error('blocked'))

    const { container } = render(<InteractiveGraphView document={demoGraphDocument} />)
    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))

    await waitFor(() => {
      expect(container.querySelector('[data-tint-graph-view]')).toHaveAttribute(
        'data-fullscreen',
        'true',
      )
    })
    expect(container.querySelector('[data-tint-graph-view]')).toHaveAttribute(
      'data-theater',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument()
  })
})
