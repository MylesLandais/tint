import type { ComponentType } from 'react'
import type { GraphCommand } from './commands'
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

/**
 * Per-node validation, as `InteractiveGraphView` accepts it.
 *
 * Lives here rather than beside whichever producer happens to exist: it is the
 * shape of a public prop, and the first producer was a mock, which left the type
 * of a shipped contract importable only from a fixture.
 */
export type NodeValidationMap = ReadonlyMap<string, readonly ValidationIssue[]>

export function flattenValidationIssues(
  validationByNodeId: NodeValidationMap,
): readonly ValidationIssue[] {
  return [...validationByNodeId.values()].flat()
}

/**
 * What a definition knows about the graph it is working in.
 *
 * One type, not three: `NodeCreationContext` and `PortDerivationContext` were
 * separate declarations of the identical `{ graphId: string }`, and
 * `GraphValidationContext` was that plus `nodes` — three names for one idea, of
 * which only the third was reachable from the barrel, so a consumer writing a
 * `NodeDefinition` could not name the argument its own `validate` receives.
 */
export type NodeContext = {
  graphId: string
  /** Present where the whole graph is in scope, as it is for validation. */
  nodes?: readonly GraphNode[]
}

export type GraphValidationContext = NodeContext & {
  nodes: readonly GraphNode[]
}

export type NodeViewProps<TConfiguration = unknown> = {
  node: GraphNode<TConfiguration>
  selected: boolean
  focused: boolean
  readonly: boolean
  validation: readonly ValidationIssue[]
  runtime?: NodeRuntimeSummary
  dispatch: (command: GraphCommand) => void
}

export type NodeInspectorProps<TConfiguration = unknown> = {
  node: GraphNode<TConfiguration>
  readonly: boolean
  validation: readonly ValidationIssue[]
  dispatch: (command: GraphCommand) => void
}

export type NodeDefinition<TConfiguration = unknown> = {
  kind: string
  version: string
  displayName: string
  category: string
  createDefault: (context: NodeContext) => TConfiguration
  derivePorts: (
    configuration: TConfiguration,
    context: NodeContext,
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
