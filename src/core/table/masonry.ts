export type MasonryDensity = 'auto' | 2 | 3 | 4 | 5 | 6

/** Pure column count from the masonry container width. */
export function columnsFor(width: number, density: MasonryDensity = 'auto', target = 320): number {
  if (width < 640) return 1
  if (width < 900) return 2
  if (density !== 'auto') return Math.max(2, Math.min(6, density))
  return Math.max(2, Math.min(6, Math.round(width / target)))
}

export type MasonryPosition = { x: number; y: number; width: number }

/** Shortest-column packing keeps DOM order independent of visual position. */
export function placeMasonryItems(
  containerWidth: number,
  heights: readonly number[],
  columnCount: number,
  gap: number,
): { positions: readonly MasonryPosition[]; height: number } {
  const count = Math.max(1, Math.floor(columnCount))
  const width = (containerWidth - gap * (count - 1)) / count
  const columnHeights = Array<number>(count).fill(0)
  const positions = heights.map((height) => {
    let column = 0
    for (let candidate = 1; candidate < count; candidate += 1) {
      if (columnHeights[candidate]! < columnHeights[column]!) column = candidate
    }
    const position = { x: column * (width + gap), y: columnHeights[column]!, width }
    columnHeights[column] += height + gap
    return position
  })
  return { positions, height: Math.max(0, ...columnHeights) - (heights.length ? gap : 0) }
}
