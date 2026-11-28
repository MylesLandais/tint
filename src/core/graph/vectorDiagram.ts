// The archive transfers drawing primitives, never an executable SVG document.
export type VectorElement = {
  tag: string
  attrs?: Record<string, string>
  children?: VectorElement[]
  text?: string
  label?: string
}
export type VectorDiagram = { viewBox: string; elements: VectorElement[] }

const number = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][-+]?\\d+)?'
const boxPattern = new RegExp('^\\s*(' + number + ')[,\\s]+(' + number + ')[,\\s]+(' + number + ')[,\\s]+(' + number + ')\\s*$')
const tags = new Set('g rect circle ellipse line path polygon polyline text tspan defs marker clipPath #text'.split(' '))

export function isVectorDiagram(value: unknown): value is VectorDiagram {
  if (!value || typeof value !== 'object' || !('viewBox' in value) || typeof value.viewBox !== 'string' ||
      !('elements' in value) || !Array.isArray(value.elements) || !value.elements.length) return false
  const bounds = boxPattern.exec(value.viewBox)?.slice(1).map(Number)
  if (!bounds || !bounds.every(Number.isFinite) || bounds[2] <= 0 || bounds[3] <= 0) return false

  let count = 0
  let size = 0
  function valid(item: unknown, depth: number): boolean {
    if (++count > 4000 || depth > 40 || !item || typeof item !== 'object' || !('tag' in item) ||
        typeof item.tag !== 'string' || !tags.has(item.tag)) return false
    for (const field of ['text', 'label'] as const) {
      if (field in item) {
        const v = (item as VectorElement)[field]
        if (typeof v !== 'string' || v.length > 8192) return false
        size += v.length
      }
    }
    if ('attrs' in item) {
      if (!item.attrs || typeof item.attrs !== 'object' || Array.isArray(item.attrs)) return false
      for (const [key, v] of Object.entries(item.attrs)) {
        if (typeof v !== 'string' || key.length > 32 || v.length > 100000) return false
        size += key.length + v.length
      }
    }
    return size <= 500000 && (!('children' in item) || Array.isArray(item.children) && item.children.every(child => valid(child, depth + 1)))
  }
  return value.elements.every(item => valid(item, 0))
}
