import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { XyflowCanvasProps } from './adapter/XyflowCanvas'

/**
 * The canvas is replaced with a probe so the props `InteractiveGraphView` hands
 * it are inspectable, and the command channel can be driven directly. A real
 * xyflow pointer drag is not reachable in jsdom, and mocking the drag would
 * only re-assert the mock.
 */
const captured: { props?: XyflowCanvasProps } = {}
vi.mock('./adapter/XyflowCanvas', () => ({
  XyflowCanvas: (props: XyflowCanvasProps) => {
    captured.props = props
    return null
  },
}))

const { InteractiveGraphView } = await import('./InteractiveGraphView')
const { demoGraphDocument } = await import('../../docs/graph/fixtures/demoDocument')

describe('InteractiveGraphView reduction', () => {
  /**
   * A node drag used to travel two paths at once: the adapter fired an
   * `onNodePositionsCommit` callback *and* a `node.move` command, and this
   * component reduced each in its own handler against the same,
   * not-yet-updated `document` — two documents per drag, the second discarding
   * the first.
   */
  it('hands the canvas one mutation channel, not two', () => {
    render(<InteractiveGraphView document={demoGraphDocument} />)

    expect(captured.props).toBeDefined()
    expect(captured.props).not.toHaveProperty('onNodePositionsCommit')
  })

  it('applies a node move exactly once', () => {
    const onDocumentChange = vi.fn()
    render(
      <InteractiveGraphView
        document={demoGraphDocument}
        onDocumentChange={onDocumentChange}
      />,
    )

    captured.props?.onCommand?.({
      type: 'node.move',
      nodeIds: ['n-trigger'],
      positions: { 'n-trigger': { x: 42, y: 42 } },
    })

    expect(onDocumentChange).toHaveBeenCalledTimes(1)
    const [next] = onDocumentChange.mock.calls[0] as [typeof demoGraphDocument]
    expect(next.nodes.find((node) => node.id === 'n-trigger')?.position).toEqual({
      x: 42,
      y: 42,
    })
  })

  /**
   * The loop that made the canvas unusable: a pan bumped the revision, the new
   * document flowed back in, the canvas re-applied its viewport, and xyflow
   * fired another `onMoveEnd`.
   */
  it('does not bump the revision when only the camera moved', () => {
    const onDocumentChange = vi.fn()
    render(
      <InteractiveGraphView
        document={demoGraphDocument}
        onDocumentChange={onDocumentChange}
      />,
    )

    captured.props?.onCommand?.({
      type: 'viewport.set',
      viewport: { x: 1, y: 2, zoom: 1.1 },
    })

    const [next] = onDocumentChange.mock.calls[0] as [typeof demoGraphDocument]
    expect(next.revision).toBe(demoGraphDocument.revision)
    expect(next.viewport).toEqual({ x: 1, y: 2, zoom: 1.1 })
  })
})
