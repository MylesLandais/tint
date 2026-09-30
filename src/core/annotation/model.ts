import type { Point, VectorGeometry } from './geometry'

const clamp = (value: number) => Math.max(0, Math.min(1, value))

export function normalizedPoint(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>): Point {
  return {
    x: rect.width > 0 ? clamp((clientX - rect.left) / rect.width) : 0,
    y: rect.height > 0 ? clamp((clientY - rect.top) / rect.height) : 0,
  }
}

export function boxFromPoints(start: Point, end: Point): VectorGeometry {
  return { kind: 'box', x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) }
}

export function movedGeometry(geometry: VectorGeometry, start: Point, end: Point, vertex?: number, corner = false): VectorGeometry {
  if (geometry.kind === 'polygon') {
    if (geometry.points.length === 0) return geometry
    if (vertex !== undefined) return { kind: 'polygon', points: geometry.points.map((point, index) => index === vertex ? end : point) }
    const dx = Math.max(-Math.min(...geometry.points.map((point) => point.x)), Math.min(1 - Math.max(...geometry.points.map((point) => point.x)), end.x - start.x))
    const dy = Math.max(-Math.min(...geometry.points.map((point) => point.y)), Math.min(1 - Math.max(...geometry.points.map((point) => point.y)), end.y - start.y))
    return { kind: 'polygon', points: geometry.points.map((point) => ({ x: point.x + dx, y: point.y + dy })) }
  }
  if (corner) return { ...geometry, width: Math.max(.0001, end.x - geometry.x), height: Math.max(.0001, end.y - geometry.y) }
  return { ...geometry, x: Math.max(0, Math.min(1 - geometry.width, geometry.x + end.x - start.x)), y: Math.max(0, Math.min(1 - geometry.height, geometry.y + end.y - start.y)) }
}
