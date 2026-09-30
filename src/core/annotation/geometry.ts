export type Point = { x: number; y: number }
export type VectorGeometry = { kind: 'box'; x: number; y: number; width: number; height: number } | { kind: 'polygon'; points: Point[] }
export type TrackKeyframe<G = VectorGeometry> = { timestamp: number; geometry: G; visible: boolean; occluded: boolean }

export function interpolateGeometry(a: VectorGeometry, b: VectorGeometry, fraction: number): VectorGeometry | null {
  const t = Math.max(0, Math.min(1, fraction))
  const mix = (x: number, y: number) => x + (y - x) * t
  if (a.kind === 'box' && b.kind === 'box') return { kind: 'box', x: mix(a.x,b.x), y: mix(a.y,b.y), width: mix(a.width,b.width), height: mix(a.height,b.height) }
  if (a.kind === 'polygon' && b.kind === 'polygon' && a.points.length === b.points.length)
    return { kind: 'polygon', points: a.points.map((p,i) => ({ x: mix(p.x,b.points[i]!.x), y: mix(p.y,b.points[i]!.y) })) }
  return null
}

export function splitTrack<T extends { timestamp: number }>(frames: readonly T[], cursor: number): [T[], T[]] {
  return [frames.filter(f => f.timestamp < cursor), frames.filter(f => f.timestamp >= cursor)]
}

export function joinTracks<T extends { timestamp: number }>(a: readonly T[], b: readonly T[]): T[] {
  const times = new Set(a.map(f => f.timestamp))
  if (b.some(f => times.has(f.timestamp))) throw new Error('Tracks overlap at a keyframe; resolve the overlap before joining.')
  return [...a, ...b].sort((x,y) => x.timestamp-y.timestamp)
}
