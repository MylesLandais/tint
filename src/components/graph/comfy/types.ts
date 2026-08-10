/** Minimal ComfyUI workflow (0.4) shapes used by the tint parser. */

export type ComfyPosition =
  | readonly [number, number]
  | readonly number[]
  | { x: number; y: number; [k: string]: unknown }
export type ComfySize =
  | readonly [number, number]
  | readonly number[]
  | { width: number; height: number; [k: string]: unknown }

export type ComfySlot = {
  name: string
  type?: string | string[]
  label?: string
  link?: number | null
  links?: number[] | null
  widget?: { name: string }
  slot_index?: number
}

export type ComfyNode = {
  id: number | string
  type: string
  pos: ComfyPosition
  size?: ComfySize
  flags?: Record<string, unknown>
  order?: number
  mode?: number
  title?: string
  inputs?: ComfySlot[]
  outputs?: ComfySlot[]
  properties?: Record<string, unknown>
  widgets_values?: unknown
  color?: string
  bgcolor?: string
}

/** Classic array link: [id, origin_id, origin_slot, target_id, target_slot, type] */
export type ComfyLinkArray = [
  number,
  number | string,
  number,
  number | string,
  number,
  string?,
]

export type ComfyLinkObject = {
  id: number
  origin_id: number | string
  origin_slot: number
  target_id: number | string
  target_slot: number
  type?: string
}

export type ComfyLink = ComfyLinkArray | ComfyLinkObject

export type ComfySubgraph = {
  id: string
  name?: string
  nodes?: ComfyNode[]
  links?: ComfyLink[]
  groups?: unknown[]
  inputs?: unknown[]
  outputs?: unknown[]
  widgets?: unknown[]
  [k: string]: unknown
}

export type ComfyWorkflow = {
  id?: string
  revision?: number
  last_node_id?: number
  last_link_id?: number
  nodes?: ComfyNode[]
  links?: ComfyLink[]
  groups?: unknown[]
  definitions?: {
    subgraphs?: ComfySubgraph[]
  }
  config?: unknown
  extra?: Record<string, unknown>
  version?: number | string
}

export type ComfyNodeConfiguration = {
  classType: string
  comfyId: number | string
  title?: string
  widgets: unknown[]
  mode: number
  order: number
  properties: Record<string, unknown>
  /** True when this node is a prompt-bearing PrimitiveStringMultiline. */
  isPrompt?: boolean
  promptText?: string
  modelName?: string
  color?: string
  bgcolor?: string
}

export type ParseComfyWorkflowOptions = {
  /**
   * When the workflow embeds subgraph definitions, prefer expanding the first
   * (or named) subgraph as the canvas document — typical for template packs.
   */
  expandSubgraphs?: boolean
  subgraphName?: string
  graphId?: string
  normalizeOrigin?: boolean
}
