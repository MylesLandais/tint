import { describe, expect, it } from 'vitest'
import { createSyntheticHouseWav } from './syntheticHouseWav'

describe('createSyntheticHouseWav', () => {
  it('creates a deterministic mono PCM WAV with the requested duration', () => {
    const first = createSyntheticHouseWav({ durationSeconds: 2, sampleRate: 8_000, seed: 3 })
    const second = createSyntheticHouseWav({ durationSeconds: 2, sampleRate: 8_000, seed: 3 })
    const view = new DataView(first.buffer, first.byteOffset, first.byteLength)

    expect(new TextDecoder().decode(first.subarray(0, 4))).toBe('RIFF')
    expect(new TextDecoder().decode(first.subarray(8, 12))).toBe('WAVE')
    expect(view.getUint16(22, true)).toBe(1)
    expect(view.getUint32(24, true)).toBe(8_000)
    expect(view.getUint16(34, true)).toBe(16)
    expect(view.getUint32(40, true)).toBe(32_000)
    expect(first).toEqual(second)
  })

  it('places a non-silent kick on 128 BPM quarter-note boundaries', () => {
    const wav = createSyntheticHouseWav({ durationSeconds: 1, sampleRate: 8_000, seed: 1 })
    const samples = new Int16Array(wav.buffer, wav.byteOffset + 44)
    const halfSecond = 4_000

    expect(Math.max(...samples.subarray(0, 500))).toBeGreaterThan(1_000)
    expect(Math.max(...samples.subarray(halfSecond - 250, halfSecond + 500))).toBeGreaterThan(1_000)
  })

  it('rejects malformed fixture parameters before allocation', () => {
    expect(() => createSyntheticHouseWav({ durationSeconds: 0 })).toThrow(/duration/)
    expect(() => createSyntheticHouseWav({ durationSeconds: 1, sampleRate: Number.NaN })).toThrow(/sample rate/)
    expect(() => createSyntheticHouseWav({ durationSeconds: 1, bpm: 0 })).toThrow(/BPM/)
  })
})
