import type {
  PlaybackAdapter,
  PlaybackItem,
  PlaybackSnapshot,
  PlaybackStatus,
} from './types'

export const DEFAULT_PLAYBACK_STORAGE_KEY = 'tint.playback.v1'

const EMPTY_PLAYBACK_SNAPSHOT: PlaybackSnapshot = Object.freeze({
  queue: Object.freeze([]),
  currentItemId: null,
  status: 'idle',
  positionSeconds: 0,
  updatedAt: null,
})

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type BrowserEventTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>

export type BrowserPlaybackAdapterOptions = {
  /** Defaults to window.localStorage, resolved lazily so SSR imports stay safe. */
  storage?: BrowserStorage
  /** Defaults to window and is used to follow changes made in another tab. */
  eventTarget?: BrowserEventTarget
  storageKey?: string
  now?: () => Date
}

export type BrowserPlaybackAdapter = PlaybackAdapter & {
  getSnapshot(): PlaybackSnapshot
  getServerSnapshot(): PlaybackSnapshot
  subscribe(listener: () => void): () => void
  start(): void
  stop(): void
}

type StoredPlayback = {
  version: 1
  snapshot: PlaybackSnapshot
}

/**
 * A metadata-only playback queue backed by localStorage. It intentionally does
 * not discover or fetch media: the host supplies safe queue metadata, while
 * Tint owns lifecycle, validation, cross-tab observation, and snapshots.
 */
export function createBrowserPlaybackAdapter(
  options: BrowserPlaybackAdapterOptions = {},
): BrowserPlaybackAdapter {
  const storageKey = options.storageKey ?? DEFAULT_PLAYBACK_STORAGE_KEY
  const now = options.now ?? (() => new Date())
  const listeners = new Set<() => void>()
  let snapshot = EMPTY_PLAYBACK_SNAPSHOT
  let started = false

  const resolveStorage = (): BrowserStorage | undefined =>
    options.storage ?? (typeof window === 'undefined' ? undefined : window.localStorage)
  const resolveEventTarget = (): BrowserEventTarget | undefined =>
    options.eventTarget ?? (typeof window === 'undefined' ? undefined : window)

  const publish = (next: PlaybackSnapshot, persist: boolean) => {
    snapshot = next
    if (persist) {
      resolveStorage()?.setItem(
        storageKey,
        JSON.stringify({ version: 1, snapshot: next } satisfies StoredPlayback),
      )
    }
    for (const listener of listeners) listener()
  }

  const commit = (update: Omit<PlaybackSnapshot, 'updatedAt'>) => {
    publish({ ...update, updatedAt: now().toISOString() }, true)
  }

  const load = (raw: string | null): PlaybackSnapshot => {
    if (raw === null) return EMPTY_PLAYBACK_SNAPSHOT
    try {
      const stored = JSON.parse(raw) as unknown
      if (!isRecord(stored) || stored.version !== 1 || !isRecord(stored.snapshot)) {
        return EMPTY_PLAYBACK_SNAPSHOT
      }
      return parseSnapshot(stored.snapshot)
    } catch {
      return EMPTY_PLAYBACK_SNAPSHOT
    }
  }

  const onStorage = (event: Event) => {
    const storageEvent = event as StorageEvent
    if (storageEvent.key !== storageKey) return
    const next = load(storageEvent.newValue)
    if (snapshotsEqual(snapshot, next)) return
    publish(next, false)
  }

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => EMPTY_PLAYBACK_SNAPSHOT,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    start() {
      if (started) return
      started = true
      const stored = load(resolveStorage()?.getItem(storageKey) ?? null)
      if (!snapshotsEqual(snapshot, stored)) publish(stored, false)
      resolveEventTarget()?.addEventListener('storage', onStorage)
    },
    stop() {
      if (!started) return
      started = false
      resolveEventTarget()?.removeEventListener('storage', onStorage)
    },
    replaceQueue(items, currentItemId) {
      const queue = normalizeQueue(items)
      const selected = currentItemId === undefined
        ? retainCurrent(snapshot.currentItemId, queue)
        : requireCurrent(currentItemId, queue)
      commit({
        queue,
        currentItemId: selected,
        status: selected === null
          ? 'idle'
          : selected === snapshot.currentItemId
            ? snapshot.status
            : 'paused',
        positionSeconds: selected === snapshot.currentItemId ? snapshot.positionSeconds : 0,
      })
    },
    select(itemId, selectionOptions = {}) {
      requireCurrent(itemId, snapshot.queue)
      const sameItem = itemId === snapshot.currentItemId
      commit({
        queue: snapshot.queue,
        currentItemId: itemId,
        status: selectionOptions.status ?? (sameItem ? snapshot.status : 'paused'),
        positionSeconds: normalizePosition(
          selectionOptions.positionSeconds ?? (sameItem ? snapshot.positionSeconds : 0),
        ),
      })
    },
    setStatus(status) {
      assertStatus(status)
      if (snapshot.currentItemId === null && status !== 'idle') {
        throw new Error('Playback status requires a current queue item')
      }
      commit({ ...snapshot, status })
    },
    setPosition(positionSeconds) {
      if (snapshot.currentItemId === null) {
        throw new Error('Playback position requires a current queue item')
      }
      commit({ ...snapshot, positionSeconds: normalizePosition(positionSeconds) })
    },
    clear() {
      resolveStorage()?.removeItem(storageKey)
      publish(EMPTY_PLAYBACK_SNAPSHOT, false)
    },
  }
}

function normalizeQueue(items: readonly PlaybackItem[]): readonly PlaybackItem[] {
  const ids = new Set<string>()
  return Object.freeze(items.map((item) => {
    const id = requireText(item.id, 'Playback item id')
    if (ids.has(id)) throw new Error(`Duplicate playback item id: ${id}`)
    ids.add(id)
    const title = requireText(item.title, 'Playback item title')
    const durationSeconds = item.durationSeconds === undefined
      ? undefined
      : normalizePosition(item.durationSeconds)
    return Object.freeze({
      id,
      title,
      ...(optionalText(item.artist) ? { artist: optionalText(item.artist) } : {}),
      ...(optionalText(item.artwork) ? { artwork: optionalText(item.artwork) } : {}),
      ...(optionalText(item.href) ? { href: optionalText(item.href) } : {}),
      ...(durationSeconds === undefined ? {} : { durationSeconds }),
    })
  }))
}

function parseSnapshot(value: Readonly<Record<string, unknown>>): PlaybackSnapshot {
  if (!Array.isArray(value.queue)) return EMPTY_PLAYBACK_SNAPSHOT
  const queue = normalizeQueue(value.queue as PlaybackItem[])
  const currentItemId = requireCurrent(
    typeof value.currentItemId === 'string' ? value.currentItemId : null,
    queue,
  )
  const status = value.status
  assertStatus(status)
  if (currentItemId === null && status !== 'idle') return EMPTY_PLAYBACK_SNAPSHOT
  const positionSeconds = normalizePosition(value.positionSeconds)
  const updatedAt = typeof value.updatedAt === 'string' ? value.updatedAt : null
  return Object.freeze({ queue, currentItemId, status, positionSeconds, updatedAt })
}

function requireCurrent(id: string | null, queue: readonly PlaybackItem[]): string | null {
  if (id === null) return null
  if (!queue.some((item) => item.id === id)) throw new Error(`Unknown playback item: ${id}`)
  return id
}

function retainCurrent(id: string | null, queue: readonly PlaybackItem[]): string | null {
  return id !== null && queue.some((item) => item.id === id) ? id : (queue[0]?.id ?? null)
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) throw new TypeError(`${label} must not be empty`)
  return value.trim()
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function normalizePosition(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError('Playback seconds must be a finite non-negative number')
  }
  return value
}

function assertStatus(value: unknown): asserts value is PlaybackStatus {
  if (value !== 'idle' && value !== 'playing' && value !== 'paused' && value !== 'ended') {
    throw new TypeError(`Unknown playback status: ${String(value)}`)
  }
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function snapshotsEqual(left: PlaybackSnapshot, right: PlaybackSnapshot): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}
