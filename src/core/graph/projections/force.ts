import type { GraphDocument, Point } from '../document'

/**
 * Force-directed layout, as a pure function of the document.
 *
 * No React, no `requestAnimationFrame`, no internal clock: `createForceLayout`
 * seeds a state and `stepForceLayout` advances it, so the caller decides whether
 * that happens sixty times a second or once in a test. `forceLayout` is the
 * batch form for hosts that just want coordinates.
 *
 * Seeding is derived from node ids rather than `Math.random`, which makes the
 * result reproducible: the same document lays out the same way in a test, in a
 * screenshot, and after a reload. A layout that moved every time it was opened
 * would be unreadable as a *view* of anything — the eye reads position as
 * meaning.
 */
export type ForceLayoutOptions = {
  /** The box the layout is seeded into and pulled toward. */
  width?: number
  height?: number
  /** Coulomb-style node separation. */
  repulsion?: number
  /** Rest length of an edge. */
  springLength?: number
  springStrength?: number
  /** Pull toward the centre, which is what keeps disconnected islands on screen. */
  centerStrength?: number
  /** Velocity retained per step. Below 1, or the system never settles. */
  damping?: number
  timeStep?: number
  /** Steps run by `forceLayout`. */
  iterations?: number
}

type ResolvedOptions = Required<ForceLayoutOptions>

const DEFAULTS: ResolvedOptions = {
  width: 800,
  height: 600,
  repulsion: 8000,
  springLength: 140,
  springStrength: 0.08,
  centerStrength: 0.015,
  damping: 0.82,
  timeStep: 0.6,
  iterations: 300,
}

export type ForceLayoutState = {
  readonly nodeIds: readonly string[]
  readonly positions: ReadonlyMap<string, Point>
  readonly velocities: ReadonlyMap<string, Point>
  /** Node-id pairs, deduplicated and self-loops dropped. */
  readonly links: readonly (readonly [string, string])[]
  /** Total kinetic energy after the last step. Zero on a fresh state. */
  readonly energy: number
}

/** FNV-1a. Any stable hash would do; this one is short and has no dependencies. */
function hash(value: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/**
 * Seeded on a circle rather than at random points in the box: a uniform cloud
 * frequently starts with two nodes nearly coincident, and the repulsion term
 * goes as 1/r², so the first step throws them to infinity.
 */
function seedPosition(nodeId: string, index: number, count: number, options: ResolvedOptions): Point {
  const jitter = (hash(nodeId) % 1000) / 1000
  const angle = ((index + jitter) / Math.max(count, 1)) * Math.PI * 2
  const radius = Math.min(options.width, options.height) * 0.35
  return {
    x: options.width / 2 + Math.cos(angle) * radius,
    y: options.height / 2 + Math.sin(angle) * radius,
  }
}

/**
 * Seed a layout for a document.
 *
 * `previous` carries a settled layout forward: nodes it already knows keep their
 * position and velocity, and only genuinely new ids are seeded onto the ring.
 * Without it, adding one node relocates every other node — and a view that
 * re-seeded whenever the document object changed would re-scatter the whole
 * graph on every unrelated edit.
 */
export function createForceLayout(
  document: GraphDocument,
  options: ForceLayoutOptions = {},
  previous?: ForceLayoutState,
): ForceLayoutState {
  const resolved = { ...DEFAULTS, ...options }
  /**
   * Sorted, so the seed ring is a function of the id set and not of the order
   * the host happens to hold nodes in. Seeding by document index meant adding a
   * node — or a host re-sorting its list — relaid out every *other* node too.
   */
  const nodeIds = document.nodes.map((node) => node.id).sort()
  const known = new Set(nodeIds)

  const positions = new Map<string, Point>()
  const velocities = new Map<string, Point>()
  nodeIds.forEach((nodeId, index) => {
    const carried = previous?.positions.get(nodeId)
    positions.set(
      nodeId,
      carried ? { ...carried } : seedPosition(nodeId, index, nodeIds.length, resolved),
    )
    const velocity = previous?.velocities.get(nodeId)
    velocities.set(nodeId, velocity ? { ...velocity } : { x: 0, y: 0 })
  })

  const seen = new Set<string>()
  const links: (readonly [string, string])[] = []
  for (const edge of document.edges) {
    const a = edge.source.nodeId
    const b = edge.target.nodeId
    if (a === b || !known.has(a) || !known.has(b)) continue
    // Two ports between the same pair are one spring, not two — otherwise the
    // pair is pulled twice as hard as an equivalent single-port pair, and the
    // layout encodes port count rather than connectivity.
    const key = a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push([a, b])
  }

  return { nodeIds, positions, velocities, links, energy: 0 }
}

export function stepForceLayout(
  state: ForceLayoutState,
  options: ForceLayoutOptions = {},
): ForceLayoutState {
  const o = { ...DEFAULTS, ...options }
  const { nodeIds } = state
  if (nodeIds.length === 0) return state

  const forces = new Map<string, Point>(nodeIds.map((id) => [id, { x: 0, y: 0 }]))

  for (let i = 0; i < nodeIds.length; i += 1) {
    const a = nodeIds[i] as string
    const pa = state.positions.get(a) as Point
    for (let j = i + 1; j < nodeIds.length; j += 1) {
      const b = nodeIds[j] as string
      const pb = state.positions.get(b) as Point
      let dx = pa.x - pb.x
      let dy = pa.y - pb.y
      let distanceSq = dx * dx + dy * dy
      if (distanceSq < 0.01) {
        // Coincident nodes have no direction to separate along. Nudge them apart
        // deterministically rather than dividing by zero.
        dx = ((hash(a + b) % 100) - 50) / 100 || 0.5
        dy = ((hash(b + a) % 100) - 50) / 100 || 0.5
        distanceSq = dx * dx + dy * dy
      }
      const distance = Math.sqrt(distanceSq)
      const magnitude = o.repulsion / distanceSq
      const fx = (dx / distance) * magnitude
      const fy = (dy / distance) * magnitude
      const fa = forces.get(a) as Point
      const fb = forces.get(b) as Point
      fa.x += fx
      fa.y += fy
      fb.x -= fx
      fb.y -= fy
    }
  }

  for (const [a, b] of state.links) {
    const pa = state.positions.get(a) as Point
    const pb = state.positions.get(b) as Point
    const dx = pb.x - pa.x
    const dy = pb.y - pa.y
    const distance = Math.sqrt(dx * dx + dy * dy) || 0.01
    const magnitude = (distance - o.springLength) * o.springStrength
    const fx = (dx / distance) * magnitude
    const fy = (dy / distance) * magnitude
    const fa = forces.get(a) as Point
    const fb = forces.get(b) as Point
    fa.x += fx
    fa.y += fy
    fb.x -= fx
    fb.y -= fy
  }

  const cx = o.width / 2
  const cy = o.height / 2
  const positions = new Map<string, Point>()
  const velocities = new Map<string, Point>()
  let energy = 0

  for (const nodeId of nodeIds) {
    const force = forces.get(nodeId) as Point
    const position = state.positions.get(nodeId) as Point
    const velocity = state.velocities.get(nodeId) as Point

    force.x += (cx - position.x) * o.centerStrength
    force.y += (cy - position.y) * o.centerStrength

    const vx = (velocity.x + force.x * o.timeStep) * o.damping
    const vy = (velocity.y + force.y * o.timeStep) * o.damping
    velocities.set(nodeId, { x: vx, y: vy })
    positions.set(nodeId, { x: position.x + vx * o.timeStep, y: position.y + vy * o.timeStep })
    energy += vx * vx + vy * vy
  }

  return { ...state, positions, velocities, energy }
}

export function forceLayout(
  document: GraphDocument,
  options: ForceLayoutOptions = {},
): ReadonlyMap<string, Point> {
  const iterations = options.iterations ?? DEFAULTS.iterations
  let state = createForceLayout(document, options)
  for (let i = 0; i < iterations; i += 1) state = stepForceLayout(state, options)
  return state.positions
}
