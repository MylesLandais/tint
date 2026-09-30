export const DEFAULT_NARRATION_RATES = [0.75, 1, 1.25, 1.5, 2] as const

export function narrationTimeAfterSkip(current: number, delta: number, duration: number): number {
  const maximum = Number.isFinite(duration) && duration > 0 ? duration : 0
  return Math.max(0, Math.min(maximum, current + delta))
}

export function narrationProgress(current: number, duration: number): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return Math.max(0, Math.min(100, (current / duration) * 100))
}
