import type { GraphPort } from '../contracts'
import { createNodeRegistry, type NodeDefinition } from '../contracts'
import type { ComfyNodeConfiguration } from '../comfy/types'
import { ComfyNodeView } from './ComfyNodeView'
import { GenericNodeView } from './GenericNodeView'
import { ScriptNodeView, type ScriptNodeConfiguration } from './ScriptNodeView'

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

const triggerDefinition: NodeDefinition = {
  kind: 'trigger',
  version: '1',
  displayName: 'Trigger',
  category: 'automation',
  createDefault: () => ({ event: 'manual' }),
  derivePorts: () => ports([{ key: 'out', direction: 'output' }]),
  validate: async () => [],
  render: GenericNodeView,
}

const actionDefinition: NodeDefinition = {
  kind: 'action',
  version: '1',
  displayName: 'Action',
  category: 'automation',
  createDefault: () => ({ action: 'noop' }),
  derivePorts: () =>
    ports([
      { key: 'in', direction: 'input' },
      { key: 'out', direction: 'output' },
    ]),
  validate: async () => [],
  render: GenericNodeView,
}

const scriptDefinition: NodeDefinition<ScriptNodeConfiguration> = {
  kind: 'script',
  version: '1',
  displayName: 'Script',
  category: 'scripting',
  createDefault: () => ({
    language: 'typescript',
    sourceRef: 'scripts/untitled.ts',
    entrypoint: 'main',
    permissions: [],
  }),
  derivePorts: () =>
    ports([
      { key: 'in', direction: 'input' },
      { key: 'out', direction: 'output' },
    ]),
  validate: async (node) => {
    if (!node.configuration.sourceRef) {
      return [
        {
          code: 'SCRIPT_SOURCE_REQUIRED',
          message: 'Script nodes require a sourceRef',
          severity: 'error',
        },
      ]
    }
    return []
  },
  render: ScriptNodeView,
}

const ontologyDefinition: NodeDefinition = {
  kind: 'ontology.class',
  version: '1',
  displayName: 'Ontology class',
  category: 'ontology',
  createDefault: () => ({ iri: 'https://example.org/Class' }),
  derivePorts: () =>
    ports([
      { key: 'broader', direction: 'input' },
      { key: 'narrower', direction: 'output' },
    ]),
  validate: async () => [],
  render: GenericNodeView,
}

const comfyDefinition: NodeDefinition<ComfyNodeConfiguration> = {
  kind: 'comfy.node',
  version: '1',
  displayName: 'Comfy node',
  category: 'comfy',
  createDefault: () => ({
    classType: 'Unknown',
    comfyId: 0,
    widgets: [],
    mode: 0,
    order: 0,
    properties: {},
  }),
  derivePorts: () => [],
  validate: async () => [],
  render: ComfyNodeView,
}

export const defaultNodeDefinitions: readonly NodeDefinition[] = [
  triggerDefinition,
  actionDefinition,
  scriptDefinition as NodeDefinition,
  ontologyDefinition,
  comfyDefinition as NodeDefinition,
]

export function createDefaultNodeRegistry() {
  return createNodeRegistry(defaultNodeDefinitions)
}
