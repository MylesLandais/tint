import { describe, expect, it } from 'vitest'
import { topologicalLanes } from './dependency'
import { documentOf, edge, node } from '../../../test/graphBuilders'

describe('topologicalLanes', () => {
  it('sorts a chain and assigns increasing depth', () => {
    const document = documentOf(
      [node('a'), node('b'), node('c')],
      [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c')],
    )

    const projection = topologicalLanes(document)

    expect(projection.order).toEqual(['a', 'b', 'c'])
    expect([...projection.depthByNodeId.entries()].sort()).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ])
    expect(projection.acyclic).toBe(true)
    expect(projection.issues).toEqual([])
  })

  it('takes the longest path, not the shortest', () => {
    // a → b → c and a → c. `c` runs after `b`, so its depth is 2, not 1.
    const document = documentOf(
      [node('a'), node('b'), node('c')],
      [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c'), edge('a-c', 'a', 'c')],
    )

    expect(topologicalLanes(document).depthByNodeId.get('c')).toBe(2)
  })

  it('does not double-count two edges between the same pair', () => {
    // Two ports, one dependency. Counting both leaves `b` at indegree 1 forever.
    const document = documentOf(
      [node('a'), node('b')],
      [edge('one', 'a', 'b', 'out', 'left'), edge('two', 'a', 'b', 'out', 'right')],
    )

    const projection = topologicalLanes(document)

    expect(projection.order).toEqual(['a', 'b'])
    expect(projection.acyclic).toBe(true)
  })

  it('reports a duplicate edge id', () => {
    const document = documentOf(
      [node('a'), node('b')],
      [edge('same', 'a', 'b'), edge('same', 'a', 'b')],
    )

    expect(topologicalLanes(document).issues).toContainEqual(
      expect.objectContaining({ code: 'DuplicateEdge', severity: 'error' }),
    )
  })

  it('reports an edge pointing at a node that is not there', () => {
    const document = documentOf([node('a')], [edge('dangling', 'a', 'ghost')])

    const projection = topologicalLanes(document)

    expect(projection.issues).toContainEqual(
      expect.objectContaining({ code: 'UnknownEdgeNode', severity: 'error' }),
    )
    // The dangling edge is dropped rather than poisoning the sort.
    expect(projection.order).toEqual(['a'])
    expect(projection.acyclic).toBe(false)
  })

  it('names the members of a cycle and refuses to order the graph', () => {
    const document = documentOf(
      [node('a'), node('b'), node('c')],
      [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c'), edge('c-a', 'c', 'a')],
    )

    const projection = topologicalLanes(document)

    expect(projection.cycleNodeIds).toEqual(['a', 'b', 'c'])
    expect(projection.order).toEqual([])
    expect(projection.acyclic).toBe(false)
    expect(projection.issues).toContainEqual(expect.objectContaining({ code: 'Cycle' }))
  })

  it('orders independent roots deterministically, not by insertion', () => {
    const forwards = topologicalLanes(documentOf([node('b'), node('a'), node('c')], []))
    const backwards = topologicalLanes(documentOf([node('c'), node('a'), node('b')], []))

    expect(forwards.order).toEqual(['a', 'b', 'c'])
    expect(backwards.order).toEqual(forwards.order)
  })

  it('handles an empty document', () => {
    const projection = topologicalLanes(documentOf([], []))

    expect(projection.order).toEqual([])
    expect(projection.acyclic).toBe(true)
  })
})
