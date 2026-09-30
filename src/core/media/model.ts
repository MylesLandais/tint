/** Display time for a media element, including its unloaded/live states. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.floor(seconds % 60)
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

export function clampPercent(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
}

export function clampUnit(value: number): number {
  return clampPercent(value * 100) / 100
}

/** A horizontal range rises left-to-right; a vertical range rises bottom-to-top. */
export function pointerPercent(
  position: number,
  start: number,
  length: number,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
): number {
  if (!Number.isFinite(length) || length <= 0) return 0
  return clampPercent(((orientation === 'vertical' ? start + length - position : position - start) / length) * 100)
}

export function normalizePeaks(samples: readonly number[]): number[] {
  let highest = 1
  for (const sample of samples) {
    if (Number.isFinite(sample)) highest = Math.max(highest, sample)
  }
  return samples.map((sample) => clampUnit(sample / highest))
}

export function playbackProgress(currentTime: number, duration: number): number {
  return Number.isFinite(duration) && duration > 0 ? clampPercent((currentTime / duration) * 100) : 0
}

export function remainingTime(currentTime: number, duration: number): number {
  return Number.isFinite(duration) && duration > 0 ? Math.max(duration - currentTime, 0) : 0
}

export type PlaybackQueueStatus = 'idle' | 'playing' | 'paused' | 'ended'

export function queueItemStatus(index: number, currentIndex: number, status: PlaybackQueueStatus): string {
  if (index === currentIndex) {
    return status === 'playing' ? 'Playing' : status === 'paused' ? 'Paused' : status === 'ended' ? 'Finished' : 'Current'
  }
  return currentIndex >= 0 && index < currentIndex ? 'Played' : 'Up next'
}
