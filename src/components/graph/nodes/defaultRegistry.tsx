import type { FormSchema } from '../../form/contracts'
import type { GraphPort } from '../contracts'
import { createNodeRegistry, type NodeDefinition } from '../contracts'
import { GenericNodeView } from './GenericNodeView'
import { ScriptNodeView, type ScriptNodeConfiguration } from './ScriptNodeView'

const triggerFormSchema: FormSchema = {
  id: 'graph.trigger',
  version: '1',
  title: '',
  sections: [
    {
      id: 'config',
      title: 'Configuration',
      fields: [{ name: 'event', kind: 'text', label: 'Event', required: true }],
    },
  ],
}

const actionFormSchema: FormSchema = {
  id: 'graph.action',
  version: '1',
  title: '',
  sections: [
    {
      id: 'config',
      title: 'Configuration',
      fields: [{ name: 'action', kind: 'text', label: 'Action', required: true }],
    },
  ],
}

const scriptFormSchema: FormSchema = {
  id: 'graph.script',
  version: '1',
  title: '',
  sections: [
    {
      id: 'config',
      title: 'Configuration',
      fields: [
        {
          name: 'language',
          kind: 'select',
          label: 'Language',
          options: [
            { value: 'typescript', label: 'TypeScript' },
            { value: 'python', label: 'Python' },
            { value: 'lua', label: 'Lua' },
          ],
        },
        { name: 'sourceRef', kind: 'text', label: 'Source', required: true },
        { name: 'entrypoint', kind: 'text', label: 'Entrypoint' },
        { name: 'runtimeProfileId', kind: 'text', label: 'Runtime' },
        { name: 'permissions', kind: 'tags', label: 'Permissions' },
      ],
    },
  ],
}

const ontologyFormSchema: FormSchema = {
  id: 'graph.ontology',
  version: '1',
  title: '',
  sections: [
    {
      id: 'config',
      title: 'Configuration',
      fields: [{ name: 'iri', kind: 'text', label: 'IRI', required: true }],
    },
  ],
}

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
  formSchema: triggerFormSchema,
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
  formSchema: actionFormSchema,
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
  formSchema: scriptFormSchema,
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
  formSchema: ontologyFormSchema,
}

/**
 * The domain-neutral definitions every graph gets.
 *
 * `comfy.node` used to be one of them, which pointed the dependency the wrong
 * way: the neutral component imported the Comfy types and pulled ComfyNodeView
 * — 685 lines of ComfyUI-specific editors — into every consumer's bundle, for
 * graphs that contain no Comfy nodes at all. Hosts that want it compose it in:
 *
 * ```ts
 * const registry = createDefaultNodeRegistry()
 * registry.register(comfyNodeDefinition)
 * ```
 */
export const defaultNodeDefinitions: readonly NodeDefinition[] = [
  triggerDefinition,
  actionDefinition,
  scriptDefinition as NodeDefinition,
  ontologyDefinition,
]

export function createDefaultNodeRegistry() {
  return createNodeRegistry(defaultNodeDefinitions)
}
