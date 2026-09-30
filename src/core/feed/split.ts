export function splitPaneMode(containerWidth: number, hasEnd: boolean): 'stacked' | 'columns' {
  return containerWidth < (hasEnd ? 900 : 600) ? 'stacked' : 'columns'
}

export function resizedPaneWidth(startWidth: number, delta: number, containerWidth: number, minPanePx: number, hasEnd: boolean): number {
  const minimum = Math.max(0, minPanePx)
  const maximum = Math.max(minimum, containerWidth - minimum * (hasEnd ? 2 : 1))
  return Math.round(Math.min(maximum, Math.max(minimum, startWidth + delta)))
}
