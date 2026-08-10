import type {
  GraphDocument,
  GraphEdge,
  GraphNode,
  GraphPort,
  Point,
} from '../contracts'
import type {
  ComfyLink,
  ComfyLinkArray,
  ComfyLinkObject,
  ComfyNode,
  ComfyNodeConfiguration,
  ComfyPosition,
  ComfySlot,
  ComfySubgraph,
  ComfyWorkflow,
  ParseComfyWorkflowOptions,
} from './types'

function isLinkArray(link: ComfyLink): link is ComfyLinkArray {
  return Array.isArray(link)
}

function normalizeLink(link: ComfyLink): ComfyLinkObject {
  if (isLinkArray(link)) {
    const [id, origin_id, origin_slot, target_id, target_slot, type] = link
    return { id, origin_id, origin_slot, target_id, target_slot, type }
  }
  return link
}

function readPosition(pos: ComfyPosition): Point {
  if (Array.isArray(pos)) return { x: pos[0] ?? 0, y: pos[1] ?? 0 }
  const record = pos as { x?: number; y?: number }
  return { x: Number(record.x) || 0, y: Number(record.y) || 0 }
}

function widgetList(values: unknown): unknown[] {
  if (Array.isArray(values)) return values
  if (values && typeof values === 'object') return Object.values(values)
  return []
}

function slotType(slot: ComfySlot | undefined): string | undefined {
  if (!slot?.type) return undefined
  return Array.isArray(slot.type) ? slot.type.join('|') : String(slot.type)
}

function portId(direction: 'input' | 'output', index: number, name: string): string {
  return `${direction}:${index}:${name}`
}

function buildPorts(node: ComfyNode): GraphPort[] {
  const inputs = (node.inputs ?? []).map((slot, index) => ({
    id: portId('input', index, slot.name),
    key: slot.label ?? slot.name,
    direction: 'input' as const,
    cardinality: 'single' as const,
    dataType: slotType(slot) ? { localName: slotType(slot) } : undefined,
  }))
  const outputs = (node.outputs ?? []).map((slot, index) => ({
    id: portId('output', index, slot.name),
    key: slot.label ?? slot.name,
    direction: 'output' as const,
    cardinality: 'multiple' as const,
    dataType: slotType(slot) ? { localName: slotType(slot) } : undefined,
  }))
  return [...inputs, ...outputs]
}

function extractModelName(classType: string, widgets: unknown[]): string | undefined {
  if (
    classType === 'CheckpointLoaderSimple' ||
    classType === 'LoraLoaderModelOnly' ||
    classType === 'LoraLoader' ||
    classType === 'LatentUpscaleModelLoader' ||
    classType === 'LTXAVTextEncoderLoader'
  ) {
    const first = widgets[0]
    return typeof first === 'string' ? first : undefined
  }
  return undefined
}

function isPromptNode(node: ComfyNode): boolean {
  if (node.type !== 'PrimitiveStringMultiline') return false
  const title = (node.title ?? '').toLowerCase()
  return title.includes('prompt') || title === ''
}

function toConfiguration(node: ComfyNode): ComfyNodeConfiguration {
  const widgets = widgetList(node.widgets_values)
  const prompt = isPromptNode(node) && typeof widgets[0] === 'string' ? widgets[0] : undefined
  return {
    classType: node.type,
    comfyId: node.id,
    title: node.title,
    widgets,
    mode: node.mode ?? 0,
    order: node.order ?? 0,
    properties: node.properties ?? {},
    isPrompt: Boolean(prompt != null || (node.title ?? '').toLowerCase().includes('prompt')),
    promptText: typeof prompt === 'string' ? prompt : undefined,
    modelName: extractModelName(node.type, widgets),
    color: node.color,
    bgcolor: node.bgcolor,
  }
}

function selectGraphSource(
  workflow: ComfyWorkflow,
  options: ParseComfyWorkflowOptions,
): { nodes: ComfyNode[]; links: ComfyLink[]; name: string; source: 'subgraph' | 'root' } {
  const expand = options.expandSubgraphs !== false
  const subgraphs = workflow.definitions?.subgraphs ?? []
  if (expand && subgraphs.length > 0) {
    const match =
      (options.subgraphName
        ? subgraphs.find((sub) => sub.name === options.subgraphName)
        : undefined) ?? subgraphs[0]!
    return {
      nodes: match.nodes ?? [],
      links: match.links ?? [],
      name: match.name ?? match.id,
      source: 'subgraph',
    }
  }
  return {
    nodes: workflow.nodes ?? [],
    links: workflow.links ?? [],
    name: 'root',
    source: 'root',
  }
}

function nodeKey(id: number | string): string {
  return `comfy-${id}`
}

/**
 * Parse a ComfyUI workflow JSON document into tint's canonical GraphDocument.
 * Does not execute the workflow. Subgraphs are expanded by default.
 */
export function parseComfyWorkflow(
  workflow: ComfyWorkflow,
  options: ParseComfyWorkflowOptions = {},
): GraphDocument {
  const selected = selectGraphSource(workflow, options)
  const positions = selected.nodes.map((node) => readPosition(node.pos))
  const minX =
    options.normalizeOrigin === false
      ? 0
      : positions.reduce((min, point) => Math.min(min, point.x), Number.POSITIVE_INFINITY)
  const minY =
    options.normalizeOrigin === false
      ? 0
      : positions.reduce((min, point) => Math.min(min, point.y), Number.POSITIVE_INFINITY)
  const originX = Number.isFinite(minX) ? minX : 0
  const originY = Number.isFinite(minY) ? minY : 0

  const nodes: GraphNode<ComfyNodeConfiguration>[] = selected.nodes.map((node) => {
    const configuration = toConfiguration(node)
    const position = readPosition(node.pos)
    return {
      id: nodeKey(node.id),
      kind: 'comfy.node',
      position: {
        x: position.x - originX,
        y: position.y - originY,
      },
      presentation: {
        label: configuration.title ?? configuration.classType,
        description: configuration.classType,
        accent: configuration.isPrompt
          ? '#175cd3'
          : configuration.modelName
            ? '#0f6e56'
            : undefined,
      },
      configuration,
      ports: buildPorts(node),
      capabilities: {
        movable: true,
        connectable: false,
        deletable: false,
        editable: Boolean(configuration.isPrompt),
      },
    }
  })

  const nodeByComfyId = new Map(
    selected.nodes.map((node) => [String(node.id), node] as const),
  )

  const edges: GraphEdge[] = selected.links.map((raw) => {
    const link = normalizeLink(raw)
    const sourceNode = nodeByComfyId.get(String(link.origin_id))
    const targetNode = nodeByComfyId.get(String(link.target_id))
    const sourceSlot = sourceNode?.outputs?.[link.origin_slot]
    const targetSlot = targetNode?.inputs?.[link.target_slot]
    const sourcePort = sourceSlot
      ? portId('output', link.origin_slot, sourceSlot.name)
      : portId('output', link.origin_slot, `slot-${link.origin_slot}`)
    const targetPort = targetSlot
      ? portId('input', link.target_slot, targetSlot.name)
      : portId('input', link.target_slot, `slot-${link.target_slot}`)

    return {
      id: `comfy-link-${link.id}`,
      source: { nodeId: nodeKey(link.origin_id), portId: sourcePort },
      target: { nodeId: nodeKey(link.target_id), portId: targetPort },
      kind: link.type ?? 'comfy',
      metadata: { comfyLinkId: link.id, dataType: link.type },
    }
  })

  const graphId =
    options.graphId ??
    (typeof workflow.id === 'string' ? `comfy:${workflow.id}` : 'comfy:workflow')

  return {
    schemaVersion: '0.1.0',
    id: graphId,
    revision: `r${workflow.revision ?? 0}`,
    nodes,
    edges,
    groups: [],
    metadata: {
      format: 'comfyui-workflow',
      comfyVersion: workflow.version,
      source: selected.source,
      sourceName: selected.name,
      lastNodeId: workflow.last_node_id,
      lastLinkId: workflow.last_link_id,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
  }
}

export function findComfyPromptNode(
  document: GraphDocument,
): GraphNode<ComfyNodeConfiguration> | undefined {
  return document.nodes.find((node) => {
    const config = node.configuration as ComfyNodeConfiguration
    return node.kind === 'comfy.node' && config?.isPrompt
  }) as GraphNode<ComfyNodeConfiguration> | undefined
}

/** Immutably patch the prompt text on the first prompt-bearing Comfy node. */
export function updateComfyPrompt(
  document: GraphDocument,
  promptText: string,
): GraphDocument {
  const promptNode = findComfyPromptNode(document)
  if (!promptNode) return document

  return {
    ...document,
    revision: nextRevision(document.revision),
    nodes: document.nodes.map((node) => {
      if (node.id !== promptNode.id) return node
      const configuration = node.configuration as ComfyNodeConfiguration
      const widgets = [...configuration.widgets]
      widgets[0] = promptText
      return {
        ...node,
        configuration: {
          ...configuration,
          widgets,
          promptText,
        },
      }
    }),
  }
}

function nextRevision(revision: string): string {
  const match = /^r(\d+)$/.exec(revision)
  if (!match) return `r${Date.now()}`
  return `r${Number(match[1]) + 1}`
}

export function isComfyWorkflow(value: unknown): value is ComfyWorkflow {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return Array.isArray(record.nodes) || Array.isArray(
    (record.definitions as { subgraphs?: ComfySubgraph[] } | undefined)?.subgraphs,
  )
}
