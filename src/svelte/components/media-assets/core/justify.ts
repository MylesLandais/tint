/**
 * Justified-row layout (Google Photos / Immich style): every row fills the
 * container width exactly, rows keep a target height, and each item keeps its
 * aspect ratio. Pure function; the component only measures and renders.
 */
export type JustifyItem = { aspect: number }
export type JustifiedBox = { index: number; width: number; height: number }
export type JustifiedRow = { height: number; boxes: JustifiedBox[] }

export type JustifyOptions = {
  width: number
  targetHeight: number
  gap?: number
  /** Rows may stretch up to this factor of targetHeight before breaking. */
  maxStretch?: number
  /** Clamp extreme aspects so one panorama or sliver cannot wreck a row. */
  minAspect?: number
  maxAspect?: number
}

export function clampAspect(aspect: number, min = 0.5, max = 2.5): number {
  if (!Number.isFinite(aspect) || aspect <= 0) return 1
  return Math.min(max, Math.max(min, aspect))
}

export function justify(items: readonly JustifyItem[], options: JustifyOptions): JustifiedRow[] {
  const { width, targetHeight, gap = 4, maxStretch = 1.5, minAspect = 0.5, maxAspect = 2.5 } = options
  if (width <= 0 || items.length === 0) return []
  const rows: JustifiedRow[] = []
  let row: number[] = []
  let aspectSum = 0

  const flush = (last: boolean) => {
    if (row.length === 0) return
    const available = width - gap * (row.length - 1)
    let height = available / aspectSum
    // The last row keeps the target height instead of stretching to fill.
    if (last && height > targetHeight * maxStretch) height = targetHeight
    const boxes: JustifiedBox[] = []
    let used = 0
    row.forEach((index, position) => {
      const aspect = clampAspect(items[index].aspect, minAspect, maxAspect)
      const isLastInFullRow = position === row.length - 1 && !(last && height === targetHeight)
      // Give rounding remainder to the final box so rows end flush.
      const boxWidth = isLastInFullRow ? available - used : Math.round(aspect * height)
      used += boxWidth
      boxes.push({ index, width: Math.max(1, boxWidth), height: Math.round(height) })
    })
    rows.push({ height: Math.round(height), boxes })
    row = []
    aspectSum = 0
  }

  items.forEach((item, index) => {
    row.push(index)
    aspectSum += clampAspect(item.aspect, minAspect, maxAspect)
    const rowHeight = (width - gap * (row.length - 1)) / aspectSum
    if (rowHeight <= targetHeight) flush(false)
  })
  flush(true)
  return rows
}
