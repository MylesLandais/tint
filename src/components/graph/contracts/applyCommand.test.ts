import { describe, expect, it } from 'vitest'
import { applyCommand, nextRevision } from './applyCommand'
import { createNodeRegistry } from './registry'
import type { GraphDocument } from './document'
import type { NodeDefinition } from './registry'

/**
 * Four of the eight command kinds had no producer and no reducer, so the
 * gestures that emit them changed the canvas and not the document: a deleted
 * node came back on the next update, and a dragged connection vanished. The two
 * kinds that *were* handled were applied inline by the view while all eight were
 * reported, so a host running its own store double-applied exactly those two.
 */
const noteDefinition: NodeDefinition<{ text: string }> = {
  kind: 'note',
  version: '1',
  displayName: 'Note',
  category: 'test',
  createDefault: () => ({ text: 'untitled' }),
  derivePorts: () => [
    { id: 'in', key: 'in', direction: 'input', cardinality: 'single' },
  ],
  validate: async () => [],
  render: () => null,
}

const registry = createNodeRegistry([noteDefinition as NodeDefinition])

function document(): GraphDocument {
  return {
    schemaVersion: '1',
    id: 'g1',
    revision: 'r1',
    nodes: [
      {
        id: 'a',
        kind: 'note',
        position: { x: 0, y: 0 },
        configuration: { text: 'a' },
        ports: [],
      },
      {
        id: 'b',
        kind: 'note',
        position: { x: 10, y: 10 },
        configuration: { text: 'b' },
        ports: [],
      },
    ],
    edges: [
      {
        id: 'a->b',
        source: { nodeId: 'a', portId: 'out' },
        target: { nodeId: 'b', portId: 'in' },
      },
    ],
    groups: [{ id: 'g', childIds: ['a', 'b'] }],
    metadata: {},
  }
}

describe('applyCommand', () => {
  it('moves nodes and bumps the revision', () => {
    const next = applyCommand(
      document(),
      { type: 'node.move', nodeIds: ['a'], positions: { a: { x: 5, y: 7 } } },
      registry,
    )

    expect(next.nodes[0]?.position).toEqual({ x: 5, y: 7 })
    expect(next.nodes[1]?.position).toEqual({ x: 10, y: 10 })
    expect(next.revision).toBe('r2')
  })

  it('configures one node without touching its neighbours', () => {
    const next = applyCommand(
      document(),
      { type: 'node.configure', nodeId: 'b', configuration: { text: 'edited' } },
      registry,
    )

    expect(next.nodes[1]?.configuration).toEqual({ text: 'edited' })
    expect(next.nodes[0]?.configuration).toEqual({ text: 'a' })
  })

  it('connects two ports, and refuses to duplicate the same edge', () => {
    const connect = {
      type: 'edge.connect',
      source: { nodeId: 'b', portId: 'out' },
      target: { nodeId: 'a', portId: 'in' },
    } as const

    const connected = applyCommand(document(), connect, registry)
    expect(connected.edges).toHaveLength(2)

    // Same pair again: unchanged, and the identity is preserved so a host can
    // skip the render.
    expect(applyCommand(connected, connect, registry)).toBe(connected)
  })

  /**
   * Deleting a node used to leave its edges behind, which is how a document ends
   * up referencing nodes that no longer exist.
   */
  it('deletes a node along with the edges and group memberships that named it', () => {
    const next = applyCommand(
      document(),
      { type: 'entity.delete', entities: [{ kind: 'node', id: 'a' }] },
      registry,
    )

    expect(next.nodes.map((node) => node.id)).toEqual(['b'])
    expect(next.edges).toEqual([])
    expect(next.groups[0]?.childIds).toEqual(['b'])
  })

  it('creates a node from the registry, deriving its ports', () => {
    const next = applyCommand(
      document(),
      { type: 'node.create', kind: 'note', position: { x: 1, y: 2 } },
      registry,
    )

    const created = next.nodes.at(-1)
    expect(next.nodes).toHaveLength(3)
    expect(created?.configuration).toEqual({ text: 'untitled' })
    expect(created?.ports.map((port) => port.key)).toEqual(['in'])
  })

  it('ignores a create for a kind the registry does not know', () => {
    const before = document()
    const next = applyCommand(
      before,
      { type: 'node.create', kind: 'nope', position: { x: 0, y: 0 } },
      registry,
    )

    expect(next).toBe(before)
  })

  it('treats selection as view state, not document state', () => {
    const before = document()
    const next = applyCommand(
      before,
      {
        type: 'selection.replace',
        selection: {
          nodeIds: new Set(['a']),
          edgeIds: new Set(),
          groupIds: new Set(),
        },
      },
      registry,
    )

    expect(next).toBe(before)
    expect(next.revision).toBe('r1')
  })

  it('sets the viewport and bumps the revision once', () => {
    const next = applyCommand(
      document(),
      { type: 'viewport.set', viewport: { x: 10, y: 20, zoom: 1.5 } },
      registry,
    )

    expect(next.viewport).toEqual({ x: 10, y: 20, zoom: 1.5 })
    expect(next.revision).toBe('r2')
  })

  it('ignores an identical viewport.set without bumping the revision', () => {
    const withViewport = applyCommand(
      document(),
      { type: 'viewport.set', viewport: { x: 10, y: 20, zoom: 1.5 } },
      registry,
    )
    const again = applyCommand(
      withViewport,
      { type: 'viewport.set', viewport: { x: 10, y: 20, zoom: 1.5 } },
      registry,
    )

    expect(again).toBe(withViewport)
    expect(again.revision).toBe('r2')
  })
})

describe('nextRevision', () => {
  it('counts up', () => {
    expect(nextRevision('r1')).toBe('r2')
    expect(nextRevision('r41')).toBe('r42')
  })

  it('restarts from a token it did not write', () => {
    expect(nextRevision('sha-deadbeef')).toBe('r1')
  })
})
