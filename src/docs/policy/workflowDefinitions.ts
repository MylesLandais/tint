import {
  createDefaultNodeRegistry,
  GenericNodeView,
  type GraphPort,
  type NodeDefinition,
  type NodeRegistry,
} from '../../components/graph'

/**
 * Docs-only workflow node kinds for Policy page composition.
 *
 * Registered onto `createDefaultNodeRegistry()` the same way hosts add
 * `comfyNodeDefinition` — never shipped as a public package.
 */

function ports(
  specs: Array<Pick<GraphPort, 'key' | 'direction'> & Partial<GraphPort>>,
): GraphPort[] {
  return specs.map((spec) => ({
    id: `${spec.key}:${spec.direction}`,
    key: spec.key,
    direction: spec.direction,
    cardinality: spec.cardinality ?? 'multiple',
    dataType: spec.dataType,
    required: spec.required,
  }))
}

const KINDS = [
  'discovery',
  'policy_eval',
  'feed_write',
  'notify',
  'intent_create',
  'queue',
  'execute',
  'validate',
] as const

export type WorkflowNodeKind = (typeof KINDS)[number]

function workflowDefinition(kind: WorkflowNodeKind, displayName: string): NodeDefinition {
  const isStart = kind === 'discovery'
  return {
    kind: `workflow.${kind}`,
    version: '1',
    displayName,
    category: 'workflow',
    createDefault: () => ({ step: kind }),
    derivePorts: () =>
      isStart
        ? ports([{ key: 'out', direction: 'output' }])
        : ports([
            { key: 'in', direction: 'input' },
            { key: 'out', direction: 'output' },
          ]),
    validate: async () => [],
    render: GenericNodeView,
  }
}

export const workflowNodeDefinitions: readonly NodeDefinition[] = [
  workflowDefinition('discovery', 'Discovery'),
  workflowDefinition('policy_eval', 'Policy eval'),
  workflowDefinition('feed_write', 'Feed write'),
  workflowDefinition('notify', 'Notify'),
  workflowDefinition('intent_create', 'Intent create'),
  workflowDefinition('queue', 'Queue'),
  workflowDefinition('execute', 'Execute'),
  workflowDefinition('validate', 'Validate'),
]

/** Fresh registry with default + workflow definitions (docs Policy page). */
export function createWorkflowNodeRegistry(): NodeRegistry {
  const registry = createDefaultNodeRegistry()
  for (const definition of workflowNodeDefinitions) {
    registry.register(definition)
  }
  return registry
}
