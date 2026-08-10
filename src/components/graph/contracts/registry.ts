import type { ComponentType } from 'react'
import type { GraphNode, GraphPort } from './document'

export type ValidationIssue = {
  code: string
  message: string
  severity: 'error' | 'warning' | 'info'
  path?: string
}

export type NodeRuntimeSummary = {
  status: 'idle' | 'running' | 'succeeded' | 'failed'
  detail?: string
}

export type NodeCreationContext = {
  graphId: string
}

export type PortDerivationContext = {
  graphId: string
}

export type GraphValidationContext = {
  graphId: string
  nodes: readonly GraphNode[]
}

export type NodeViewProps<TConfiguration = unknown> = {
  node: GraphNode<TConfiguration>
  selected: boolean
  focused: boolean
  readonly: boolean
  validation: readonly ValidationIssue[]
  runtime?: NodeRuntimeSummary
  dispatch: (command: import('./commands').GraphCommand) => void
}

export type NodeInspectorProps<TConfiguration = unknown> = {
  node: GraphNode<TConfiguration>
  readonly: boolean
  validation: readonly ValidationIssue[]
  dispatch: (command: import('./commands').GraphCommand) => void
}

export type NodeDefinition<TConfiguration = unknown> = {
  kind: string
  version: string
  displayName: string
  category: string
  createDefault: (context: NodeCreationContext) => TConfiguration
  derivePorts: (
    configuration: TConfiguration,
    context: PortDerivationContext,
  ) => readonly GraphPort[]
  validate: (
    node: GraphNode<TConfiguration>,
    context: GraphValidationContext,
  ) => Promise<readonly ValidationIssue[]>
  render: ComponentType<NodeViewProps<TConfiguration>>
  inspector?: ComponentType<NodeInspectorProps<TConfiguration>>
}

export type NodeDefinitionFilter = {
  category?: string
  kind?: string
}

export type NodeRegistry = {
  get: (kind: string) => NodeDefinition | undefined
  require: (kind: string) => NodeDefinition
  list: (filter?: NodeDefinitionFilter) => readonly NodeDefinition[]
  register: (definition: NodeDefinition) => void
}

export function createNodeRegistry(
  definitions: readonly NodeDefinition[] = [],
): NodeRegistry {
  const map = new Map<string, NodeDefinition>()
  for (const definition of definitions) {
    map.set(definition.kind, definition)
  }

  return {
    get(kind) {
      return map.get(kind)
    },
    require(kind) {
      const definition = map.get(kind)
      if (!definition) {
        throw new Error(`Unknown node kind: ${kind}`)
      }
      return definition
    },
    list(filter) {
      const all = [...map.values()]
      return all.filter((definition) => {
        if (filter?.kind && definition.kind !== filter.kind) return false
        if (filter?.category && definition.category !== filter.category) return false
        return true
      })
    },
    register(definition) {
      map.set(definition.kind, definition)
    },
  }
}
