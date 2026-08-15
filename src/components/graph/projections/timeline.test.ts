import { describe, expect, it } from 'vitest'
import { projectTimeline, type GraphSpan } from './timeline'
import { documentOf, edge, node } from '../../../test/graphBuilders'

const chain = documentOf(
  [node('a', 'Task', 'Fetch'), node('b', 'Task', 'Transcribe'), node('c', 'Task', 'Judge')],
  [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c')],
)

function span(id: string, nodeId: string, start: number, end: number): GraphSpan {
  return { id, nodeId, start, end }
}

describe('projectTimeline', () => {
  it('has an empty domain when there are no spans', () => {
    const projection = projectTimeline(chain, [], { variant: 'gantt' })

    expect(projection).toMatchObject({ start: 0, end: 0 })
    // The tracks still exist — a schedule where nothing ran is three empty
    // lanes, not an empty chart.
    expect(projection.tracks).toHaveLength(3)
  })

  it('covers every span in the domain', () => {
    const projection = projectTimeline(chain, [
      span('s1', 'a', 100, 250),
      span('s2', 'b', 250, 400),
    ])

    expect(projection).toMatchObject({ start: 100, end: 400 })
  })

  it('gantt lanes follow dependency depth, not document order', () => {
    const scrambled = documentOf(
      [node('c', 'Task', 'Judge'), node('a', 'Task', 'Fetch'), node('b', 'Task', 'Transcribe')],
      [edge('a-b', 'a', 'b'), edge('b-c', 'b', 'c')],
    )

    const projection = projectTimeline(scrambled, [span('s1', 'a', 0, 1)], {
      variant: 'gantt',
    })

    expect(projection.tracks.map((track) => track.id)).toEqual(['a', 'b', 'c'])
    expect(projection.tracks.map((track) => track.lane)).toEqual([0, 1, 2])
  })

  it('labels a track from the node presentation, and an interval from its span', () => {
    const projection = projectTimeline(
      chain,
      [{ id: 's1', nodeId: 'a', label: 'attempt 2', start: 0, end: 5 }],
      { variant: 'gantt' },
    )

    expect(projection.tracks[0]?.label).toBe('Fetch')
    expect(projection.tracks[0]?.intervals[0]?.label).toBe('attempt 2')
  })

  it('keeps repeated spans for one node on that node’s lane, in start order', () => {
    const projection = projectTimeline(
      chain,
      [span('retry', 'a', 300, 400), span('first', 'a', 0, 100)],
      { variant: 'gantt' },
    )

    expect(projection.tracks[0]?.intervals.map((interval) => interval.id)).toEqual([
      'first',
      'retry',
    ])
  })

  it('surfaces spans whose node is not in the document', () => {
    // The loudest signal an adapter can give that the ontology and the runtime
    // disagree, so it must not be silently dropped.
    const projection = projectTimeline(chain, [span('ghost', 'nowhere', 0, 10)], {
      variant: 'gantt',
    })

    const unmatched = projection.tracks.at(-1)
    expect(unmatched?.id).toBe('__unmatched__')
    expect(unmatched?.intervals.map((interval) => interval.id)).toEqual(['ghost'])
  })

  it('indents trace spans by their parent chain', () => {
    const projection = projectTimeline(
      chain,
      [
        { id: 'root', nodeId: 'a', start: 0, end: 100 },
        { id: 'child', nodeId: 'b', start: 10, end: 60, parentSpanId: 'root' },
        { id: 'grandchild', nodeId: 'c', start: 20, end: 40, parentSpanId: 'child' },
      ],
      { variant: 'trace' },
    )

    expect(projection.tracks.map((track) => track.intervals[0]?.depth)).toEqual([0, 1, 2])
  })

  it('does not hang on a circular parent chain', () => {
    const projection = projectTimeline(
      chain,
      [
        { id: 'x', nodeId: 'a', start: 0, end: 1, parentSpanId: 'y' },
        { id: 'y', nodeId: 'b', start: 0, end: 1, parentSpanId: 'x' },
      ],
      { variant: 'trace' },
    )

    expect(projection.tracks).toHaveLength(2)
  })

  it('puts every span on one lane for the range variant', () => {
    const projection = projectTimeline(
      chain,
      [span('s2', 'b', 50, 90), span('s1', 'a', 0, 40)],
      { variant: 'range' },
    )

    expect(projection.tracks).toHaveLength(1)
    expect(projection.tracks[0]?.intervals.map((interval) => interval.id)).toEqual([
      's1',
      's2',
    ])
  })

  it('normalises a span whose clock went backwards', () => {
    const projection = projectTimeline(chain, [span('s1', 'a', 400, 100)], {
      variant: 'range',
    })

    expect(projection.tracks[0]?.intervals[0]).toMatchObject({ start: 100, end: 400 })
    expect(projection).toMatchObject({ start: 100, end: 400 })
  })

  it('falls back to document order when the graph does not sort', () => {
    const cyclic = documentOf(
      [node('a'), node('b')],
      [edge('a-b', 'a', 'b'), edge('b-a', 'b', 'a')],
    )

    const projection = projectTimeline(cyclic, [span('s1', 'a', 0, 1)], { variant: 'gantt' })

    expect(projection.tracks.map((track) => track.id)).toEqual(['a', 'b'])
  })
})
