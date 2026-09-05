import { describe, expect, it, vi } from 'vitest'
import { AudioBufferRegistry } from './AudioBufferRegistry'
import { decodeLocalAudioFiles } from './decodeLocalAudioFiles'

function localFile(name: string, bytes: number[]): File {
  return {
    name,
    type: 'audio/wav',
    arrayBuffer: vi.fn(async () => Uint8Array.from(bytes).buffer),
  } as unknown as File
}

describe('decodeLocalAudioFiles', () => {
  it('decodes selected files and atomically registers track buffers', async () => {
    const registry = new AudioBufferRegistry()
    const first = { duration: 320 } as AudioBuffer
    const second = { duration: 391 } as AudioBuffer
    const decodeAudioData = vi.fn()
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second)

    await expect(decodeLocalAudioFiles({ decodeAudioData }, registry, [
      localFile('01-here-we-go.wav', [1]),
      localFile('02-apapacho.wav', [2]),
    ], (file) => file.name.slice(3, -4))).resolves.toEqual([
      { trackId: 'here-we-go', fileName: '01-here-we-go.wav', durationSeconds: 320 },
      { trackId: 'apapacho', fileName: '02-apapacho.wav', durationSeconds: 391 },
    ])
    await expect(registry.resolveTransition('unbound')).rejects.toThrow()
    expect(registry.hasTrack('here-we-go')).toBe(true)
    expect(decodeAudioData).toHaveBeenCalledTimes(2)
  })

  it('leaves the registry unchanged when any decode fails', async () => {
    const registry = new AudioBufferRegistry()
    const decodeAudioData = vi.fn()
      .mockResolvedValueOnce({ duration: 320 } as AudioBuffer)
      .mockRejectedValueOnce(new DOMException('Unsupported format', 'EncodingError'))

    await expect(decodeLocalAudioFiles({ decodeAudioData }, registry, [
      localFile('one.wav', [1]),
      localFile('two.wav', [2]),
    ], (file) => file.name)).rejects.toThrow(/two.wav/)
    expect(registry.hasTrack('one.wav')).toBe(false)
  })

  it('rejects duplicate IDs before decoding', async () => {
    const registry = new AudioBufferRegistry()
    const decodeAudioData = vi.fn()
    await expect(decodeLocalAudioFiles({ decodeAudioData }, registry, [
      localFile('one.wav', [1]),
      localFile('two.wav', [2]),
    ], () => 'duplicate')).rejects.toThrow(/Duplicate track ID/)
    expect(decodeAudioData).not.toHaveBeenCalled()
  })
})
