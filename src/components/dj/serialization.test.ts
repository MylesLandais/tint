import { describe, expect, it } from 'vitest'
import { applyDJSetCommand } from './commands'
import { compileTransition } from './transitionCompiler'
import { parseDJSet, serializeDJSet } from './serialization'
import type { DJSetDocument } from './contracts'

const document: DJSetDocument = {
  schemaVersion: '1',
  id: 'demo-midnight-128',
  revision: 'r1',
  title: 'Midnight 128',
  bpm: 128,
  beatsPerBar: 4,
  tracks: [
    { id: 'here-we-go', title: 'Here We Go', durationSeconds: 320, bpm: 128, key: '3A' },
    { id: 'apapacho', title: 'Apapacho', durationSeconds: 391, bpm: 128, key: '3A' },
    { id: 'trajadao', title: 'Trajadão', durationSeconds: 345, bpm: 128, key: '3A' },
  ],
  trackIds: ['here-we-go', 'apapacho', 'trajadao'],
  transitions: [],
  metadata: { source: 'synthetic' },
}

describe('DJ set serialization', () => {
  it('round-trips a generated set into an equivalent compiled schedule', () => {
    const generated = applyDJSetCommand(document, { type: 'transitions.generateAuto' })
    const edited = applyDJSetCommand(generated, {
      type: 'transition.automationPoint.update',
      transitionId: 'here-we-go--apapacho',
      lane: 'incoming.eqLow',
      pointIndex: 2,
      point: { beat: 64, value: 0.4 },
    })
    const restored = parseDJSet(serializeDJSet(edited))

    expect(restored).toEqual(edited)
    expect(restored.transitions.map(compileTransition)).toEqual(
      edited.transitions.map(compileTransition),
    )
  })

  it('rejects malformed JSON and dangling track references', () => {
    expect(() => parseDJSet('{')).toThrow(/valid JSON/)
    expect(() => parseDJSet(JSON.stringify({ ...document, trackIds: ['missing'] }))).toThrow(
      /unknown track/,
    )
  })

  it('rejects invalid automation timing before it can reach Web Audio', () => {
    const generated = applyDJSetCommand(document, { type: 'transitions.generateAuto' })
    const invalid = {
      ...generated,
      transitions: [{ ...generated.transitions[0], bpm: Number.NaN }],
    }

    expect(() => parseDJSet(JSON.stringify(invalid))).toThrow(/positive finite/)

    const invalidOverride = {
      ...generated,
      transitions: [{
        ...generated.transitions[0],
        automation: {
          'incoming.eqLow': {
            curve: 'step',
            points: [{ beat: 0, value: 0 }, { beat: 64, value: 'loud' }],
          },
        },
      }],
    }
    expect(() => parseDJSet(JSON.stringify(invalidOverride))).toThrow(/automation point/i)
  })
})
