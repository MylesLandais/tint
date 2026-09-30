import type { ConnectionState } from '../../client/types'

export const DEFAULT_CONNECTION_LABELS: Record<ConnectionState, string> = {
  idle: 'Idle',
  connecting: 'Connecting…',
  online: 'Online',
  reconnecting: 'Reconnecting…',
  offline: 'Offline',
  error: 'Connection error',
}

export function normalizeSkeletonLines(lines: number): number {
  return Math.max(1, Math.floor(Number.isFinite(lines) ? lines : 3))
}
