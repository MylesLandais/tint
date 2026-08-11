import type { NodeDefinition } from '../contracts'
import type { ComfyNodeConfiguration } from '../comfy/types'
import { ComfyNodeView } from './ComfyNodeView'

/**
 * The ComfyUI node definition, composed in rather than shipped by default.
 *
 * It used to sit in `defaultNodeDefinitions`, which meant the domain-neutral
 * canvas imported the Comfy types and dragged `ComfyNodeView` into every
 * consumer's bundle whether or not their graph had a single Comfy node in it.
 *
 * ```ts
 * const registry = createDefaultNodeRegistry()
 * registry.register(comfyNodeDefinition)
 * ```
 */
export const comfyNodeDefinition: NodeDefinition<ComfyNodeConfiguration> = {
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
