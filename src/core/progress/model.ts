/** Clamp a determinate progress reading to the browser ARIA range. */
export function normalizeProgress(value: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
}
