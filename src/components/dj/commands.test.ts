import { describe, expect, it } from 'vitest'
import { applyDJSetCommand } from './commands'
import { compileTransition } from './transitionCompiler'
import type { DJSetDocument, DJTrack } from './contracts'

const tracks: readonly DJTrack[] = [
  { id: 'here-we-go', title: 'Here We Go', durationSeconds: 320, bpm: 128, key: '3A' },
  { id: 'apapacho', title: 'Apapacho', durationSeconds: 391, bpm: 128, key: '3A' },
  { id: 'trajadao', title: 'Trajadão', durationSeconds: 345, bpm: 128, key: '3A' },
]

function document(trackIds: readonly string[] = tracks.map((track) => track.id)): DJSetDocument {
  return {
    schemaVersion: '1',
    id: 'demo-midnight-128',
    revision: 'r1',
    title: 'Midnight 128',
    description: 'Deep Tech → Latin Tech → Peak Tech House',
    bpm: 128,
    beatsPerBar: 4,
    tracks,
    trackIds,
    transitions: [],
    metadata: {},
  }
}

describe('applyDJSetCommand', () => {
  it('reorders the set immutably and increments its revision', () => {
    const current = document(['trajadao', 'here-we-go', 'apapacho'])
    const next = applyDJSetCommand(current, {
      type: 'tracks.reorder',
      trackIds: ['here-we-go', 'apapacho', 'trajadao'],
    })

    expect(next).not.toBe(current)
    expect(next.revision).toBe('r2')
    expect(next.trackIds).toEqual(['here-we-go', 'apapacho', 'trajadao'])
    expect(current.trackIds).toEqual(['trajadao', 'here-we-go', 'apapacho'])
  })

  it('generates the two Midnight 128 transition presets on bar boundaries', () => {
    const next = applyDJSetCommand(document(), { type: 'transitions.generateAuto' })

    expect(next.transitions).toHaveLength(2)
    expect(next.transitions.map(({ fromTrackId, toTrackId, lengthBars, preset }) => ({
      fromTrackId,
      toTrackId,
      lengthBars,
      preset,
    }))).toEqual([
      {
        fromTrackId: 'here-we-go',
        toTrackId: 'apapacho',
        lengthBars: 32,
        preset: 'long-bass-swap',
      },
      {
        fromTrackId: 'apapacho',
        toTrackId: 'trajadao',
        lengthBars: 16,
        preset: 'filter-echo-exit',
      },
    ])
    expect(next.transitions.every((transition) => transition.startBeat % 4 === 0)).toBe(true)
  })

  it('returns the same document for invalid or no-op reorders', () => {
    const current = document()
    expect(applyDJSetCommand(current, {
      type: 'tracks.reorder',
      trackIds: [...current.trackIds],
    })).toBe(current)
    expect(applyDJSetCommand(current, {
      type: 'tracks.reorder',
      trackIds: ['here-we-go', 'missing', 'trajadao'],
    })).toBe(current)
  })

  it('persists an automation point edit in the set document', () => {
    const generated = applyDJSetCommand(document(), { type: 'transitions.generateAuto' })
    const next = applyDJSetCommand(generated, {
      type: 'transition.automationPoint.update',
      transitionId: 'here-we-go--apapacho',
      lane: 'incoming.eqLow',
      pointIndex: 2,
      point: { beat: 64, value: 0.4 },
    })

    expect(next.revision).toBe('r3')
    expect(next.transitions[0]?.automation?.['incoming.eqLow']?.points[2]).toEqual({
      beat: 64,
      value: 0.4,
    })
    expect(compileTransition(next.transitions[0]!).lanes['incoming.eqLow']?.points[2]).toEqual({
      beat: 64,
      value: 0.4,
    })
    expect(generated.transitions[0]?.automation).toBeUndefined()
  })

  it('updates a transition preset and rejects missing transitions or points', () => {
    const generated = applyDJSetCommand(document(), { type: 'transitions.generateAuto' })
    const next = applyDJSetCommand(generated, {
      type: 'transition.preset.update',
      transitionId: 'here-we-go--apapacho',
      preset: 'filter-echo-exit',
    })

    expect(next.transitions[0]?.preset).toBe('filter-echo-exit')
    expect(next.transitions[0]?.automation).toBeUndefined()
    expect(applyDJSetCommand(generated, {
      type: 'transition.preset.update',
      transitionId: 'missing',
      preset: 'filter-echo-exit',
    })).toBe(generated)
    expect(applyDJSetCommand(generated, {
      type: 'transition.automationPoint.update',
      transitionId: 'here-we-go--apapacho',
      lane: 'incoming.eqLow',
      pointIndex: 99,
      point: { beat: 64, value: 0.4 },
    })).toBe(generated)
  })
})
