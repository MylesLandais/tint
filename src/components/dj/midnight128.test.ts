import { describe, expect, it } from 'vitest'
import { createMidnight128Set, identifyMidnight128Track } from './midnight128'

const imported = [
  { trackId: 'here-we-go', durationSeconds: 320 },
  { trackId: 'apapacho', durationSeconds: 391 },
  { trackId: 'trajadao', durationSeconds: 345 },
]

describe('Midnight 128 demo set', () => {
  it('derives stable IDs from the committed reference filenames', () => {
    expect(identifyMidnight128Track({ name: '01-here-we-go.wav' } as File)).toBe('here-we-go')
    expect(identifyMidnight128Track({ name: '02-apapacho.flac' } as File)).toBe('apapacho')
    expect(identifyMidnight128Track({ name: '03-trajadao.mp3' } as File)).toBe('trajadao')
    expect(() => identifyMidnight128Track({ name: 'unknown.wav' } as File)).toThrow(/Unknown Midnight 128/)
  })

  it('creates the portable 16:06 set and deterministic automatic transitions', () => {
    const document = createMidnight128Set(imported)
    expect(document).toMatchObject({
      schemaVersion: '1',
      id: 'demo-midnight-128',
      revision: 'r1',
      title: 'Midnight 128',
      description: 'Deep Tech → Latin Tech → Peak Tech House',
      bpm: 128,
      beatsPerBar: 4,
      trackIds: ['here-we-go', 'apapacho', 'trajadao'],
      metadata: { key: '3A', durationSeconds: 966 },
    })
    expect(document.tracks.map(({ id, title, durationSeconds, bpm, key }) => ({
      id, title, durationSeconds, bpm, key,
    }))).toEqual([
      { id: 'here-we-go', title: 'Michele Mancini — Here We Go', durationSeconds: 320, bpm: 128, key: '3A' },
      { id: 'apapacho', title: 'Apapacho', durationSeconds: 391, bpm: 128, key: '3A' },
      { id: 'trajadao', title: 'XAAV — Trajadão', durationSeconds: 345, bpm: 128, key: '3A' },
    ])
    expect(document.transitions).toMatchObject([
      { id: 'here-we-go--apapacho', lengthBars: 32, preset: 'long-bass-swap' },
      { id: 'apapacho--trajadao', lengthBars: 16, preset: 'filter-echo-exit' },
    ])
  })

  it('rejects missing, duplicate, and unexpectedly long or short reference tracks', () => {
    expect(() => createMidnight128Set(imported.slice(0, 2))).toThrow(/exactly three/)
    expect(() => createMidnight128Set([imported[0]!, imported[0]!, imported[2]!])).toThrow(/duplicate/i)
    expect(() => createMidnight128Set([
      { trackId: 'here-we-go', durationSeconds: 300 }, imported[1]!, imported[2]!,
    ])).toThrow(/duration/i)
  })
})
