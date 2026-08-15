import { describe, expect, it } from 'vitest'
import { createForceLayout, forceLayout, stepForceLayout } from './force'
import { documentOf, edge, node } from '../../../test/graphBuilders'

const pair = documentOf([node('a'), node('b')], [edge('a-b', 'a', 'b')])

function distance(
  positions: ReadonlyMap<string, { x: number; y: number }>,
  a: string,
  b: string,
): number {
  const pa = positions.get(a)
  const pb = positions.get(b)
  if (!pa || !pb) throw new Error(`missing position for ${a} or ${b}`)
  return Math.hypot(pa.x - pb.x, pa.y - pb.y)
}

describe('forceLayout', () => {
  it('is deterministic — the same document lays out identically', () => {
    // The whole reason for hashing node ids instead of calling Math.random:
    // position reads as meaning, so it must not change between reloads.
    expect([...forceLayout(pair).entries()]).toEqual([...forceLayout(pair).entries()])
  })

  it('does not depend on the order nodes appear in the document', () => {
    const forwards = forceLayout(documentOf([node('a'), node('b'), node('c')], []))
    const backwards = forceLayout(documentOf([node('c'), node('b'), node('a')], []))

    for (const id of ['a', 'b', 'c']) {
      expect(forwards.get(id)?.x).toBeCloseTo(backwards.get(id)?.x ?? NaN, 6)
      expect(forwards.get(id)?.y).toBeCloseTo(backwards.get(id)?.y ?? NaN, 6)
    }
  })

  it('produces finite coordinates for every node', () => {
    const positions = forceLayout(
      documentOf(
        [node('a'), node('b'), node('c'), node('d')],
        [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c'), edge('c-d', 'c', 'd')],
      ),
    )

    for (const point of positions.values()) {
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
    }
  })

  it('settles a linked pair near the spring rest length', () => {
    // Not "closer than an unlinked pair": with only two nodes, repulsion and the
    // centring pull already balance *inside* the rest length, so the spring is
    // holding them apart rather than pulling them together. The rest length is
    // the claim the spring actually makes.
    expect(distance(forceLayout(pair, { springLength: 140 }), 'a', 'b')).toBeCloseTo(140, -2)
  })

  it('places connected nodes nearer each other than nodes in another cluster', () => {
    // Two triangles joined by a single edge. This is the property a force layout
    // exists for: adjacency shows up as proximity.
    const positions = forceLayout(
      documentOf(
        ['a1', 'a2', 'a3', 'b1', 'b2', 'b3'].map((id) => node(id)),
        [
          edge('a1-a2', 'a1', 'a2'),
          edge('a2-a3', 'a2', 'a3'),
          edge('a3-a1', 'a3', 'a1'),
          edge('b1-b2', 'b1', 'b2'),
          edge('b2-b3', 'b2', 'b3'),
          edge('b3-b1', 'b3', 'b1'),
          edge('a1-b1', 'a1', 'b1'),
        ],
      ),
    )

    const withinA = distance(positions, 'a2', 'a3')
    const across = distance(positions, 'a2', 'b2')
    expect(withinA).toBeLessThan(across)
  })

  it('settles — energy decays rather than growing', () => {
    let state = createForceLayout(
      documentOf(
        [node('a'), node('b'), node('c')],
        [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c')],
      ),
    )
    for (let i = 0; i < 20; i += 1) state = stepForceLayout(state)
    const early = state.energy
    for (let i = 0; i < 300; i += 1) state = stepForceLayout(state)

    expect(state.energy).toBeLessThan(early)
  })

  it('separates coincident nodes instead of dividing by zero', () => {
    const state = stepForceLayout({
      nodeIds: ['a', 'b'],
      positions: new Map([
        ['a', { x: 100, y: 100 }],
        ['b', { x: 100, y: 100 }],
      ]),
      velocities: new Map([
        ['a', { x: 0, y: 0 }],
        ['b', { x: 0, y: 0 }],
      ]),
      links: [],
      energy: 0,
    })

    expect(Number.isFinite(state.positions.get('a')?.x ?? NaN)).toBe(true)
    expect(distance(state.positions, 'a', 'b')).toBeGreaterThan(0)
  })

  it('counts two edges between the same pair as one spring', () => {
    const twice = createForceLayout(
      documentOf(
        [node('a'), node('b')],
        [edge('one', 'a', 'b', 'out', 'left'), edge('two', 'a', 'b', 'out', 'right')],
      ),
    )

    expect(twice.links).toEqual([['a', 'b']])
  })

  it('ignores self-loops and edges to nodes that are not there', () => {
    const state = createForceLayout(
      documentOf([node('a')], [edge('self', 'a', 'a'), edge('ghost', 'a', 'nowhere')]),
    )

    expect(state.links).toEqual([])
  })

  it('handles an empty document', () => {
    expect(forceLayout(documentOf([], [])).size).toBe(0)
  })
})
