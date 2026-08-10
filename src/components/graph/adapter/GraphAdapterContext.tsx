import { createContext, useContext, type ReactNode } from 'react'
import type { GraphCommand, GraphDocument, NodeRegistry } from '../contracts'

export type GraphAdapterContextValue = {
  document: GraphDocument
  registry: NodeRegistry
  readonly: boolean
  dispatch: (command: GraphCommand) => void
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
