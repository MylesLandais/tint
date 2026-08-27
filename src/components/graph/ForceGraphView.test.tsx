import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ForceGraphView } from './ForceGraphView'
import { emptySelection } from './contracts'
import { documentOf, edge, node } from '../../test/graphBuilders'

const document = documentOf(
  [node('a', 'Task', 'Fetch'), node('b', 'Task', 'Judge')],
  [edge('a-b', 'a', 'b', 'out', 'in', 'depends_on')],
)

describe('ForceGraphView', () => {
  it('renders a control per node and a line per edge', () => {
    const { container } = render(<ForceGraphView document={document} static />)

    expect(screen.getByRole('button', { name: /Fetch/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Judge/ })).toBeInTheDocument()
    expect(container.querySelectorAll('.tint-force-graph__edge')).toHaveLength(1)
  })

  it('carries the edge kind into the DOM so policy edges can be styled apart', () => {
    const { container } = render(<ForceGraphView document={document} static />)

    expect(container.querySelector('.tint-force-graph__edge')).toHaveAttribute(
      'data-kind',
      'depends_on',
    )
  })

  it('reports selection as both a command and a selection change', () => {
    const onCommand = vi.fn()
    const onSelectionChange = vi.fn()
    render(
      <ForceGraphView
        document={document}
        static
        selection={emptySelection()}
        onCommand={onCommand}
        onSelectionChange={onSelectionChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Fetch/ }))

    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'selection.replace' }),
    )
    const [selection] = onSelectionChange.mock.calls[0] as [
      { nodeIds: ReadonlySet<string> },
    ]
    expect([...selection.nodeIds]).toEqual(['a'])
  })

  it('replaces the selection on a plain click and extends it on shift-click', () => {
    const onSelectionChange = vi.fn()
    const selection = {
      nodeIds: new Set(['a']),
      edgeIds: new Set<string>(),
      groupIds: new Set<string>(),
    }
    render(
      <ForceGraphView
        document={document}
        static
        selection={selection}
        onSelectionChange={onSelectionChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Judge/ }))
    expect([...(onSelectionChange.mock.calls[0]?.[0].nodeIds ?? [])]).toEqual(['b'])

    fireEvent.click(screen.getByRole('button', { name: /Judge/ }), { shiftKey: true })
    expect([...(onSelectionChange.mock.calls[1]?.[0].nodeIds ?? [])].sort()).toEqual([
      'a',
      'b',
    ])
  })

  it('selects from the keyboard', () => {
    const onSelectionChange = vi.fn()
    render(
      <ForceGraphView document={document} static onSelectionChange={onSelectionChange} />,
    )

    fireEvent.keyDown(screen.getByRole('button', { name: /Fetch/ }), { key: 'Enter' })

    expect(onSelectionChange).toHaveBeenCalled()
  })

  it('shows the resolved status, so a failed node is not silently a plain one', () => {
    render(
      <ForceGraphView
        document={document}
        static
        runtimeByNodeId={new Map([['a', { status: 'failed' as const }]])}
      />,
    )

    expect(screen.getByRole('button', { name: /Fetch \(Task, failed\)/ })).toBeInTheDocument()
  })

  /**
   * The regression behind the unusable canvas: this used to re-seed on
   * `document.revision`, so every node drag, configure, and pan discarded the
   * settled layout and restarted a several-hundred-step simulation.
   */
  it('does not relay out when the revision changes but the nodes do not', () => {
    const { container, rerender } = render(<ForceGraphView document={document} static />)
    const before = [...container.querySelectorAll('.tint-force-graph__node')].map((node) =>
      node.getAttribute('transform'),
    )

    rerender(
      <ForceGraphView document={{ ...document, revision: 'r99' }} static />,
    )

    expect(
      [...container.querySelectorAll('.tint-force-graph__node')].map((node) =>
        node.getAttribute('transform'),
      ),
    ).toEqual(before)
  })

  it('relaxes around a new node instead of re-scattering', () => {
    const { container, rerender } = render(<ForceGraphView document={document} static />)
    const positionOf = (label: string) => {
      const transform = container
        .querySelector(`.tint-force-graph__node[aria-label^="${label}"]`)
        ?.getAttribute('transform')
      const [x, y] = transform?.match(/-?[\d.]+/g)?.map(Number) ?? []
      return { x: x ?? NaN, y: y ?? NaN }
    }
    const before = positionOf('Fetch')

    rerender(
      <ForceGraphView
        document={{
          ...document,
          revision: 'r2',
          nodes: [...document.nodes, node('c', 'Task', 'Archive')],
        }}
        static
      />,
    )

    const after = positionOf('Fetch')
    // Some movement is right — the new node repels the others, and a layout
    // that ignored it would be lying. Re-seeding is what this rules out: a
    // fresh seed puts nodes on a ring of radius ~0.35 × the box, so anything
    // under a node's width apart is relaxation, not a restart.
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(60)
    expect(Number.isFinite(positionOf('Archive').x)).toBe(true)
  })

  it('renders an empty document without a degenerate viewBox', () => {
    const { container } = render(<ForceGraphView document={documentOf([], [])} static />)
    const svg = container.querySelector('svg')

    expect(svg?.getAttribute('viewBox')).toMatch(/^0 0 \d+ \d+$/)
  })
})
