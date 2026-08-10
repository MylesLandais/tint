import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InteractiveGraphView } from './InteractiveGraphView'
import { demoGraphDocument } from './fixtures/demoDocument'
import { toFlowEdges, toFlowNodes, selectionFromFlow } from './adapter/mappers'
import { createDefaultNodeRegistry } from './nodes/defaultRegistry'

describe('graph mappers', () => {
  it('maps the demo document into flow nodes and edges', () => {
    const nodes = toFlowNodes(demoGraphDocument)
    const edges = toFlowEdges(demoGraphDocument)

    expect(nodes).toHaveLength(demoGraphDocument.nodes.length)
    expect(edges).toHaveLength(demoGraphDocument.edges.length)
    expect(nodes.every((node) => node.type === 'tint')).toBe(true)
    expect(edges[0]?.source).toBe('n-trigger')
    expect(edges[0]?.sourceHandle).toBe('out:output')
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
  it('renders the canvas and inspector chrome', () => {
    render(<InteractiveGraphView document={demoGraphDocument} />)

    expect(screen.getByRole('application', { name: 'Graph canvas' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Graph inspector' })).toBeInTheDocument()
    expect(screen.getByText('Webhook received')).toBeInTheDocument()
    expect(screen.getByText('Enrich entities')).toBeInTheDocument()
    expect(screen.getByText('Score candidates')).toBeInTheDocument()
  })

  it('shows script source refs without embedding an editor runtime', () => {
    render(<InteractiveGraphView document={demoGraphDocument} />)

    expect(screen.getByText('scripts/enrich-entities.ts')).toBeInTheDocument()
    expect(screen.getByText('scripts/score.py')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
