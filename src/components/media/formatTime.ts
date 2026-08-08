/**
 * Media timecode as `m:ss`.
 *
 * Guards non-finite and negative input because `HTMLMediaElement.duration` is
 * `NaN` until metadata loads, and `Infinity` for live streams.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
