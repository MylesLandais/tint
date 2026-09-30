import type { FormSchema } from '../form/contracts/schema'
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

export type NodeValidationMap = ReadonlyMap<string, readonly ValidationIssue[]>

export function flattenValidationIssues(
  validationByNodeId: NodeValidationMap,
): readonly ValidationIssue[] {
  return [...validationByNodeId.values()].flat()
}

export type NodeContext = {
  graphId: string
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

/** Renderer-independent node behavior shared by UI adapters. */
export type GraphNodeDefinition<TConfiguration = unknown> = {
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
  formSchema?: FormSchema
}

export type NodeDefinitionFilter = {
  category?: string
  kind?: string
}

export type GraphNodeRegistry<TDefinition extends GraphNodeDefinition = GraphNodeDefinition> = {
  get: (kind: string) => TDefinition | undefined
  require: (kind: string) => TDefinition
  list: (filter?: NodeDefinitionFilter) => readonly TDefinition[]
  register: (definition: TDefinition) => void
}

/** The reducer needs a lookup, not a renderer-specific registry. */
export type GraphNodeLookup = Pick<GraphNodeRegistry, 'get'>

export function createGraphNodeRegistry<TDefinition extends GraphNodeDefinition = GraphNodeDefinition>(
  definitions: readonly TDefinition[] = [],
): GraphNodeRegistry<TDefinition> {
  const map = new Map<string, TDefinition>()
  for (const definition of definitions) map.set(definition.kind, definition)

  return {
    get(kind) {
      return map.get(kind)
    },
    require(kind) {
      const definition = map.get(kind)
      if (!definition) throw new Error(`Unknown node kind: ${kind}`)
      return definition
    },
    list(filter) {
      return [...map.values()].filter((definition) => {
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
