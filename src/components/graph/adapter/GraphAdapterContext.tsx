import { createContext, useContext, type ReactNode } from 'react'
import type {
  GraphCommand,
  GraphDocument,
  GraphNode,
  NodeRegistry,
  NodeRuntimeSummary,
  ValidationIssue,
} from '../contracts'

export type GraphAdapterContextValue = {
  document: GraphDocument
  /** `document.nodes` by id — every node view looks itself up on every render. */
  nodesById: ReadonlyMap<string, GraphNode>
  registry: NodeRegistry
  readonly: boolean
  dispatch: (command: GraphCommand) => void
  validationByNodeId: ReadonlyMap<string, readonly ValidationIssue[]>
  runtimeByNodeId: ReadonlyMap<string, NodeRuntimeSummary>
  /**
   * Node views that have been popped out into a side panel.
   *
   * Lives on the canvas, not in the node view: React Flow unmounts and remounts
   * node components freely, so component-local state would not survive a
   * selection change. It was a module-level `Set` with its own subscriber list —
   * which meant two graphs on one page shared pop-out state whenever their node
   * ids collided, and ids were never evicted.
   */
  poppedNodeIds: ReadonlySet<string>
  togglePopped: (nodeId: string) => void
}

const GraphAdapterContext = createContext<GraphAdapterContextValue | null>(null)

export function GraphAdapterProvider({
  value,
  children,
}: {
  value: GraphAdapterContextValue
  children: ReactNode
}) {
  return (
    <GraphAdapterContext.Provider value={value}>
      {children}
    </GraphAdapterContext.Provider>
  )
}

export function useGraphAdapter(): GraphAdapterContextValue {
  const value = useContext(GraphAdapterContext)
  if (!value) {
    throw new Error('useGraphAdapter must be used within GraphAdapterProvider')
  }
  return value
}
