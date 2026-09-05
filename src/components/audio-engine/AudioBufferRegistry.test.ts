import { describe, expect, it } from 'vitest'
import { AudioBufferRegistry, bindDJSetTransitions } from './AudioBufferRegistry'
import { createMidnight128Set } from '../dj/midnight128'

const outgoing = { duration: 320 } as AudioBuffer
const incoming = { duration: 391 } as AudioBuffer

describe('AudioBufferRegistry', () => {
  it('resolves a transition to its decoded track buffers', async () => {
    const registry = new AudioBufferRegistry()
    registry.registerTrack('here-we-go', outgoing)
    registry.registerTrack('apapacho', incoming)
    registry.bindTransition('here-we-go--apapacho', 'here-we-go', 'apapacho')

    await expect(registry.resolveTransition('here-we-go--apapacho')).resolves.toEqual({
      outgoing,
      incoming,
    })
    expect(registry.hasTrack('here-we-go')).toBe(true)
  })

  it('rejects duplicate registration, missing tracks, and stale transition bindings', async () => {
    const registry = new AudioBufferRegistry()
    registry.registerTrack('here-we-go', outgoing)
    expect(() => registry.registerTrack('here-we-go', outgoing)).toThrow(/already registered/)
    expect(() => registry.bindTransition('transition', 'here-we-go', 'missing')).toThrow(/missing/)

    registry.registerTrack('apapacho', incoming)
    registry.bindTransition('transition', 'here-we-go', 'apapacho')
    registry.removeTrack('apapacho')
    await expect(registry.resolveTransition('transition')).rejects.toThrow(/missing/)
    await expect(registry.resolveTransition('unknown')).rejects.toThrow(/not bound/)
  })
})

describe('bindDJSetTransitions', () => {
  it('binds both generated Midnight 128 transitions to their decoded buffers', async () => {
    const registry = new AudioBufferRegistry()
    const third = { duration: 345 } as AudioBuffer
    registry.registerTrack('here-we-go', outgoing)
    registry.registerTrack('apapacho', incoming)
    registry.registerTrack('trajadao', third)
    const document = createMidnight128Set([
      { trackId: 'here-we-go', durationSeconds: 320 },
      { trackId: 'apapacho', durationSeconds: 391 },
      { trackId: 'trajadao', durationSeconds: 345 },
    ])

    bindDJSetTransitions(registry, document.transitions)
    await expect(registry.resolveTransition('here-we-go--apapacho')).resolves.toEqual({ outgoing, incoming })
    await expect(registry.resolveTransition('apapacho--trajadao')).resolves.toEqual({
      outgoing: incoming,
      incoming: third,
    })
  })

  it('validates every transition before adding any binding', async () => {
    const registry = new AudioBufferRegistry()
    registry.registerTrack('here-we-go', outgoing)
    registry.registerTrack('apapacho', incoming)
    expect(() => bindDJSetTransitions(registry, [
      {
        id: 'first', fromTrackId: 'here-we-go', toTrackId: 'apapacho',
        startBeat: 0, lengthBars: 16, beatsPerBar: 4, bpm: 128, preset: 'long-bass-swap',
      },
      {
        id: 'broken', fromTrackId: 'apapacho', toTrackId: 'missing',
        startBeat: 64, lengthBars: 16, beatsPerBar: 4, bpm: 128, preset: 'filter-echo-exit',
      },
    ])).toThrow(/missing/)
    await expect(registry.resolveTransition('first')).rejects.toThrow(/not bound/)
  })
})
