import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBrowserPlaybackAdapter, DEFAULT_PLAYBACK_STORAGE_KEY } from './browserPlayback'

const QUEUE = [
  { id: 'scene-1', title: 'First scene', artist: 'Studio A', href: '/scenes/1' },
  { id: 'scene-2', title: 'Second scene', artist: 'Studio B', durationSeconds: 90 },
] as const

describe('browser playback adapter', () => {
  beforeEach(() => window.localStorage.clear())

  it('persists metadata-only queue state and restores it on start', () => {
    const now = () => new Date('2026-09-01T12:00:00.000Z')
    const writer = createBrowserPlaybackAdapter({ now })
    writer.replaceQueue(QUEUE, 'scene-2')
    writer.setPosition(14.5)
    writer.setStatus('playing')

    const stored = window.localStorage.getItem(DEFAULT_PLAYBACK_STORAGE_KEY)
    expect(stored).toContain('Second scene')
    expect(stored).not.toContain('src')

    const reader = createBrowserPlaybackAdapter()
    reader.start()
    expect(reader.getSnapshot()).toMatchObject({
      queue: QUEUE,
      currentItemId: 'scene-2',
      status: 'playing',
      positionSeconds: 14.5,
      updatedAt: '2026-09-01T12:00:00.000Z',
    })
  })

  it('publishes valid cross-tab storage changes and ignores unrelated keys', () => {
    const adapter = createBrowserPlaybackAdapter()
    const listener = vi.fn()
    adapter.start()
    adapter.subscribe(listener)

    window.dispatchEvent(new StorageEvent('storage', { key: 'somewhere-else', newValue: '{}' }))
    expect(listener).not.toHaveBeenCalled()

    const snapshot = {
      queue: QUEUE,
      currentItemId: 'scene-1',
      status: 'paused',
      positionSeconds: 8,
      updatedAt: '2026-09-01T12:00:00.000Z',
    }
    window.dispatchEvent(new StorageEvent('storage', {
      key: DEFAULT_PLAYBACK_STORAGE_KEY,
      newValue: JSON.stringify({ version: 1, snapshot }),
    }))

    expect(listener).toHaveBeenCalledOnce()
    expect(adapter.getSnapshot()).toMatchObject(snapshot)
  })

  it('rejects duplicate queues and unknown selections', () => {
    const adapter = createBrowserPlaybackAdapter()
    expect(() => adapter.replaceQueue([QUEUE[0], QUEUE[0]])).toThrow(/Duplicate playback item/)
    adapter.replaceQueue(QUEUE)
    expect(() => adapter.select('missing')).toThrow(/Unknown playback item/)
  })

  it('clears both the browser record and the live snapshot', () => {
    const adapter = createBrowserPlaybackAdapter()
    adapter.replaceQueue(QUEUE, 'scene-1')
    adapter.clear()

    expect(window.localStorage.getItem(DEFAULT_PLAYBACK_STORAGE_KEY)).toBeNull()
    expect(adapter.getSnapshot()).toEqual(adapter.getServerSnapshot?.())
  })
})
