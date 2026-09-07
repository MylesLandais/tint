import { describe, expect, it, vi } from 'vitest'
import { AudioBufferRegistry } from './AudioBufferRegistry'
import { createTrackImportStore } from './trackImportStore'

function file(name: string): File {
  return { name, arrayBuffer: vi.fn(async () => new ArrayBuffer(1)) } as unknown as File
}

describe('track import store', () => {
  it('creates the decoder only after import intent and publishes coarse queue snapshots', async () => {
    const registry = new AudioBufferRegistry()
    const createDecoder = vi.fn(() => ({
      decodeAudioData: vi.fn()
        .mockResolvedValueOnce({ duration: 320 } as AudioBuffer)
        .mockResolvedValueOnce({ duration: 391 } as AudioBuffer),
    }))
    const store = createTrackImportStore({
      registry,
      createDecoder,
      identify: (selected) => selected.name.replace(/^\d+-/, '').replace(/\.wav$/, ''),
    })
    const snapshots: string[][] = []
    store.subscribe(() => snapshots.push(store.getSnapshot().items.map((item) => item.status)))

    store.selectFiles([file('01-here-we-go.wav'), file('02-apapacho.wav')])
    expect(createDecoder).not.toHaveBeenCalled()
    expect(store.getSnapshot().items.map((item) => item.status)).toEqual(['queued', 'queued'])

    await store.importSelected()
    expect(createDecoder).toHaveBeenCalledOnce()
    expect(snapshots).toContainEqual(['decoding', 'decoding'])
    expect(store.getSnapshot()).toMatchObject({
      state: 'ready',
      items: [
        { id: 'here-we-go', status: 'ready', durationSeconds: 320 },
        { id: 'apapacho', status: 'ready', durationSeconds: 391 },
      ],
    })
    expect(registry.hasTrack('here-we-go')).toBe(true)
  })

  it('publishes a filename-specific failure and can retry after a new selection', async () => {
    const registry = new AudioBufferRegistry()
    const createDecoder = vi.fn()
      .mockReturnValueOnce({ decodeAudioData: vi.fn().mockRejectedValue(new Error('bad codec')) })
      .mockReturnValueOnce({ decodeAudioData: vi.fn().mockResolvedValue({ duration: 60 } as AudioBuffer) })
    const store = createTrackImportStore({ registry, createDecoder, identify: (selected) => selected.name })
    store.selectFiles([file('broken.wav')])
    await store.importSelected()

    expect(store.getSnapshot()).toMatchObject({
      state: 'error',
      items: [{ id: 'broken.wav', status: 'error', error: 'Could not decode broken.wav: bad codec' }],
    })
    store.selectFiles([file('working.wav')])
    await store.importSelected()
    expect(store.getSnapshot().state).toBe('ready')
    expect(registry.hasTrack('working.wav')).toBe(true)
  })

  it('rejects concurrent imports and empty selections without creating a decoder', async () => {
    const registry = new AudioBufferRegistry()
    const createDecoder = vi.fn()
    const store = createTrackImportStore({ registry, createDecoder, identify: (selected) => selected.name })
    await expect(store.importSelected()).rejects.toThrow(/Select at least one/)
    expect(createDecoder).not.toHaveBeenCalled()
  })
})
