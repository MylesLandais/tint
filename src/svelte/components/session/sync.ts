/** Drift below this is in sync; the player needs no correction. */
export const SYNC_LOCK_MS = 250
/** Drift at or above this needs a hard seek rather than a rate nudge. */
export const SYNC_SEEK_MS = 1500

export type SyncBand = 'locked' | 'correcting' | 'seeking'

/** Positive drift means this connection is ahead of the session. */
export function syncBand(driftMs: number): SyncBand {
  const magnitude = Math.abs(driftMs)
  if (magnitude < SYNC_LOCK_MS) return 'locked'
  return magnitude < SYNC_SEEK_MS ? 'correcting' : 'seeking'
}

export function formatDrift(driftMs: number): string {
  const sign = driftMs > 0 ? '+' : driftMs < 0 ? '−' : '±'
  const magnitude = Math.abs(driftMs)
  return magnitude < 1000 ? `${sign}${Math.round(magnitude)} ms` : `${sign}${(magnitude / 1000).toFixed(1)} s`
}
