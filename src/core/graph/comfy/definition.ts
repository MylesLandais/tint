import type { GraphNodeDefinition } from '../registry'
import type { ComfyNodeConfiguration } from './types'

/** ComfyUI-specific node behavior, composed into a graph only when requested. */
export const comfyGraphNodeDefinition: GraphNodeDefinition<ComfyNodeConfiguration> = {
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
}
