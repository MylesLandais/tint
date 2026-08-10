import type { GraphDocument, GraphNode, NodeRuntimeSummary } from '../../components/graph/contracts'
import type { ComfyNodeConfiguration } from '../../components/graph/comfy/types'

export type MockI2VRunStep = {
  nodeId: string
  classType: string
  label: string
}

export type MockI2VRunPhase = 'idle' | 'running' | 'completed' | 'failed'

export type MockI2VRunSnapshot = {
  phase: MockI2VRunPhase
  stepIndex: number
  stepCount: number
  /** 0–1 overall progress through the mock queue. */
  progress: number
  current?: MockI2VRunStep
  /** Human-readable status line for chrome outside the canvas. */
  detail: string
  runtimeByNodeId: ReadonlyMap<string, NodeRuntimeSummary>
  queue: readonly MockI2VRunStep[]
}

export type MockI2VRunOptions = {
  /** Delay between node advances (ms). */
  intervalMs?: number
  /**
   * Node ids that should land in `failed` when their turn arrives.
   * Defaults to TextGenerateLTX2Prompt nodes (missing custom node in the mock inventory).
   */
  failNodeIds?: ReadonlySet<string>
  /** Continue past failed nodes (Comfy-style bypass). Default true. */
  continueOnFailure?: boolean
  onUpdate?: (snapshot: MockI2VRunSnapshot) => void
}

/**
 * Class types that participate in a typical LTX image→video pass.
 * Order is preferred pipeline order; multiples of the same type keep document order.
 */
const I2V_CLASS_ORDER = [
  'CheckpointLoaderSimple',
  'LTXAVTextEncoderLoader',
  'LoraLoaderModelOnly',
  'LoraLoader',
  'PrimitiveStringMultiline',
  'CLIPTextEncode',
  'TextGenerateLTX2Prompt',
  'EmptyImage',
  'LoadImage',
  'ResizeImageMaskNode',
  'ResizeImagesByLongerEdge',
  'LTXVPreprocess',
  'EmptyLTXVLatentVideo',
  'LTXVImgToVideoInplace',
  'LTXVConditioning',
  'LTXVAddGuide',
  'LTXVCropGuides',
  'SamplerCustomAdvanced',
  'LTXVLatentUpsampler',
  'VAEDecodeTiled',
  'CreateVideo',
  'PreviewAny',
] as const

const I2V_CLASS_RANK = new Map<string, number>(
  I2V_CLASS_ORDER.map((classType, index) => [classType, index]),
)

function configOf(node: GraphNode): ComfyNodeConfiguration | null {
  if (node.kind !== 'comfy.node') return null
  return node.configuration as ComfyNodeConfiguration
}

function topoOrderIds(document: GraphDocument): string[] {
  const indegree = new Map<string, number>()
  const outbound = new Map<string, string[]>()
  for (const node of document.nodes) {
    indegree.set(node.id, 0)
    outbound.set(node.id, [])
  }
  for (const edge of document.edges) {
    const from = edge.source.nodeId
    const to = edge.target.nodeId
    if (!indegree.has(from) || !indegree.has(to)) continue
    outbound.get(from)!.push(to)
    indegree.set(to, (indegree.get(to) ?? 0) + 1)
  }

  const queue = document.nodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id)
    .sort()
  const ordered: string[] = []
  while (queue.length) {
    const id = queue.shift()!
    ordered.push(id)
    for (const next of outbound.get(id) ?? []) {
      const value = (indegree.get(next) ?? 0) - 1
      indegree.set(next, value)
      if (value === 0) queue.push(next)
    }
    queue.sort()
  }

  // Cycles / disconnected leftovers keep stable document order. Membership is a
  // Set: `ordered.includes` inside this loop made the tail O(n^2).
  if (ordered.length < document.nodes.length) {
    const seen = new Set(ordered)
    for (const node of document.nodes) {
      if (!seen.has(node.id)) ordered.push(node.id)
    }
  }
  return ordered
}

/**
 * Build the mock I2V execution queue from a parsed Comfy graph.
 * Prefers nodes on the EmptyImage / LTXVImgToVideoInplace frontier when present.
 */
export function selectMockI2VRunQueue(document: GraphDocument): MockI2VRunStep[] {
  const topo = topoOrderIds(document)
  const topoRank = new Map(topo.map((id, index) => [id, index]))

  const imageSeed = document.nodes.find((node) => {
    const classType = configOf(node)?.classType
    return classType === 'EmptyImage' || classType === 'LoadImage'
  })
  const i2vSeeds = document.nodes.filter(
    (node) => configOf(node)?.classType === 'LTXVImgToVideoInplace',
  )

  const focusIds = new Set<string>()
  if (imageSeed) focusIds.add(imageSeed.id)
  for (const seed of i2vSeeds) focusIds.add(seed.id)

  // Expand a shallow ancestor/descendant neighborhood around I2V seeds.
  if (focusIds.size) {
    const inbound = new Map<string, string[]>()
    const outbound = new Map<string, string[]>()
    for (const node of document.nodes) {
      inbound.set(node.id, [])
      outbound.set(node.id, [])
    }
    for (const edge of document.edges) {
      outbound.get(edge.source.nodeId)?.push(edge.target.nodeId)
      inbound.get(edge.target.nodeId)?.push(edge.source.nodeId)
    }
    const visit = (start: string, walk: Map<string, string[]>, depth: number) => {
      const stack: Array<{ id: string; d: number }> = [{ id: start, d: 0 }]
      while (stack.length) {
        const { id, d } = stack.pop()!
        if (d > depth) continue
        for (const next of walk.get(id) ?? []) {
          if (focusIds.has(next)) continue
          focusIds.add(next)
          stack.push({ id: next, d: d + 1 })
        }
      }
    }
    const seeds = Array.from(focusIds)
    for (const id of seeds) {
      visit(id, inbound, 4)
      visit(id, outbound, 6)
    }
  }

  const candidates = document.nodes
    .map((node) => {
      const config = configOf(node)
      if (!config) return null
      const rank = I2V_CLASS_RANK.get(config.classType)
      if (rank == null) return null
      if (focusIds.size && !focusIds.has(node.id)) {
        // Keep global loaders / prompt / output even if outside the local neighborhood.
        const keepGlobal = [
          'CheckpointLoaderSimple',
          'LTXAVTextEncoderLoader',
          'PrimitiveStringMultiline',
          'CLIPTextEncode',
          'TextGenerateLTX2Prompt',
          'CreateVideo',
          'PreviewAny',
          'VAEDecodeTiled',
        ].includes(config.classType)
        if (!keepGlobal) return null
      }
      return {
        nodeId: node.id,
        classType: config.classType,
        label: node.presentation?.label ?? config.title ?? config.classType,
        rank,
        topo: topoRank.get(node.id) ?? 0,
      }
    })
    .filter((step): step is NonNullable<typeof step> => step != null)

  candidates.sort((a, b) => a.rank - b.rank || a.topo - b.topo)

  // Deduplicate by node id while preserving sort.
  const seen = new Set<string>()
  const queue: MockI2VRunStep[] = []
  for (const step of candidates) {
    if (seen.has(step.nodeId)) continue
    seen.add(step.nodeId)
    queue.push({
      nodeId: step.nodeId,
      classType: step.classType,
      label: step.label,
    })
  }

  return queue
}

export function defaultFailNodeIds(document: GraphDocument): Set<string> {
  const ids = new Set<string>()
  for (const node of document.nodes) {
    if (configOf(node)?.classType === 'TextGenerateLTX2Prompt') {
      ids.add(node.id)
    }
  }
  return ids
}

export function buildMockI2VRuntimeMap(
  queue: readonly MockI2VRunStep[],
  stepIndex: number,
  phase: MockI2VRunPhase,
  failNodeIds: ReadonlySet<string>,
): Map<string, NodeRuntimeSummary> {
  const map = new Map<string, NodeRuntimeSummary>()
  if (phase === 'idle' || queue.length === 0) return map

  for (let index = 0; index < queue.length; index += 1) {
    const step = queue[index]!
    if (index < stepIndex) {
      map.set(step.nodeId, {
        status: failNodeIds.has(step.nodeId) ? 'failed' : 'succeeded',
        detail: failNodeIds.has(step.nodeId)
          ? 'custom node missing'
          : 'done',
      })
      continue
    }
    if (index === stepIndex && phase === 'running') {
      map.set(step.nodeId, {
        status: 'running',
        detail: `step ${index + 1}/${queue.length}`,
      })
      continue
    }
    if (index === stepIndex && phase === 'failed') {
      map.set(step.nodeId, {
        status: 'failed',
        detail: 'execution stopped',
      })
      continue
    }
    if (phase === 'completed') {
      map.set(step.nodeId, {
        status: failNodeIds.has(step.nodeId) ? 'failed' : 'succeeded',
        detail: failNodeIds.has(step.nodeId) ? 'custom node missing' : 'done',
      })
      continue
    }
    map.set(step.nodeId, { status: 'idle', detail: 'queued' })
  }
  return map
}

export function snapshotMockI2VRun(args: {
  queue: readonly MockI2VRunStep[]
  stepIndex: number
  phase: MockI2VRunPhase
  failNodeIds: ReadonlySet<string>
}): MockI2VRunSnapshot {
  const { queue, stepIndex, phase, failNodeIds } = args
  const current =
    phase === 'running' || phase === 'failed' ? queue[stepIndex] : undefined
  const progress =
    queue.length === 0
      ? 0
      : phase === 'completed'
        ? 1
        : Math.min(1, Math.max(0, (stepIndex + (phase === 'running' ? 1 : 0)) / queue.length))

  let detail = 'Idle'
  if (phase === 'running' && current) {
    detail = `Running ${current.label} (${stepIndex + 1}/${queue.length})`
  } else if (phase === 'completed') {
    detail = `Completed ${queue.length} nodes`
  } else if (phase === 'failed' && current) {
    detail = `Failed at ${current.label}`
  }

  return {
    phase,
    stepIndex,
    stepCount: queue.length,
    progress,
    current,
    detail,
    runtimeByNodeId: buildMockI2VRuntimeMap(queue, stepIndex, phase, failNodeIds),
    queue,
  }
}

export type MockI2VRunController = {
  start: () => void
  stop: () => void
  getSnapshot: () => MockI2VRunSnapshot
}

/**
 * Host-side timer that walks an I2V-ish queue and emits runtime summaries.
 * The canvas stays a dumb presenter — this never talks to Comfy.
 */
export function createMockI2VRun(
  document: GraphDocument,
  options: MockI2VRunOptions = {},
): MockI2VRunController {
  const intervalMs = options.intervalMs ?? 480
  const continueOnFailure = options.continueOnFailure !== false
  const failNodeIds = options.failNodeIds ?? defaultFailNodeIds(document)
  const queue = selectMockI2VRunQueue(document)

  let stepIndex = 0
  let phase: MockI2VRunPhase = 'idle'
  let timer: ReturnType<typeof setInterval> | null = null

  /** Current state. Pure — safe to call from a render or a store subscription. */
  const snapshot = () => snapshotMockI2VRun({ queue, stepIndex, phase, failNodeIds })

  /** Advance-and-notify. Every state change goes through here. */
  const emit = () => {
    const next = snapshot()
    options.onUpdate?.(next)
    return next
  }

  const stop = () => {
    if (timer != null) {
      clearInterval(timer)
      timer = null
    }
  }

  const advance = () => {
    if (phase !== 'running') return
    const current = queue[stepIndex]
    if (!current) {
      phase = 'completed'
      stop()
      emit()
      return
    }

    if (failNodeIds.has(current.nodeId) && !continueOnFailure) {
      phase = 'failed'
      stop()
      emit()
      return
    }

    stepIndex += 1
    if (stepIndex >= queue.length) {
      phase = 'completed'
      stop()
    }
    emit()
  }

  return {
    start() {
      stop()
      stepIndex = 0
      phase = queue.length ? 'running' : 'completed'
      emit()
      if (phase !== 'running') return
      timer = setInterval(advance, intervalMs)
    },
    stop() {
      stop()
      if (phase === 'running') {
        phase = 'idle'
        stepIndex = 0
        emit()
      }
    },
    // Reads state; it does not notify. `getSnapshot: emit` called
    // `options.onUpdate` and returned a fresh object every time, so wiring this
    // to `useSyncExternalStore` would have looped forever.
    getSnapshot: snapshot,
  }
}

/**
 * Centre a node in a canvas of the given size.
 *
 * `width`/`height` describe the canvas the camera is for, so callers measure
 * their container and pass it. They defaulted to a fixed 900x520, which made the
 * follow camera correct at exactly one breakpoint and progressively wronger at
 * every other.
 */
export function viewportForNode(
  document: GraphDocument,
  nodeId: string,
  size: { width: number; height: number },
  options?: { zoom?: number },
): { x: number; y: number; zoom: number } | undefined {
  const node = document.nodes.find((item) => item.id === nodeId)
  if (!node) return undefined
  const zoom = options?.zoom ?? 1.05
  // Half a default node, so the camera centres the node's middle, not its corner.
  const halfWidth = (node.size?.width ?? DEFAULT_NODE_WIDTH) / 2
  const halfHeight = (node.size?.height ?? DEFAULT_NODE_HEIGHT) / 2
  return {
    x: size.width / 2 - (node.position.x + halfWidth) * zoom,
    y: size.height / 2 - (node.position.y + halfHeight) * zoom,
    zoom,
  }
}

const DEFAULT_NODE_WIDTH = 280
const DEFAULT_NODE_HEIGHT = 180
