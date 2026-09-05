import { describe, expect, it } from 'vitest'
import { compileTransition } from './transitionCompiler'
import type { DJTransition } from './contracts'

const transition: DJTransition = {
  id: 'here-we-go--apapacho',
  fromTrackId: 'here-we-go',
  toTrackId: 'apapacho',
  startBeat: 0,
  lengthBars: 32,
  beatsPerBar: 4,
  bpm: 128,
  preset: 'long-bass-swap',
}

describe('compileTransition', () => {
  it('compiles the 32-bar long bass swap in musical time', () => {
    const plan = compileTransition(transition)

    expect(plan.durationBeats).toBe(128)
    expect(plan.durationSeconds).toBe(60)
    expect(plan.startBeat % transition.beatsPerBar).toBe(0)
    expect(plan.endBeat % transition.beatsPerBar).toBe(0)
    expect(plan.lanes['outgoing.gain']?.curve).toBe('equal-power-out')
    expect(plan.lanes['incoming.gain']?.curve).toBe('equal-power-in')
    expect(plan.lanes['incoming.eqLow']?.points).toEqual([
      { beat: 0, value: 0 },
      { beat: 64, value: 0 },
      { beat: 64, value: 1 },
      { beat: 128, value: 1 },
    ])
  })

  it('compiles filter and echo as independent automation for the 16-bar exit', () => {
    const plan = compileTransition({
      ...transition,
      id: 'apapacho--trajadao',
      fromTrackId: 'apapacho',
      toTrackId: 'trajadao',
      startBeat: 128,
      lengthBars: 16,
      preset: 'filter-echo-exit',
    })

    expect(plan.durationBeats).toBe(64)
    expect(plan.durationSeconds).toBe(30)
    expect(plan.effectTailBeats).toBe(8)
    expect(plan.lanes['outgoing.filterHighPass']?.points).toEqual([
      { beat: 0, value: 0 },
      { beat: 64, value: 1 },
    ])
    expect(plan.lanes['outgoing.echoWet']?.points.at(-1)).toEqual({ beat: 64, value: 0.35 })
    expect(plan.lanes['outgoing.dry']?.points.at(-1)).toEqual({ beat: 64, value: 0 })
  })

  it('rejects transitions that cannot be scheduled safely', () => {
    expect(() => compileTransition({ ...transition, bpm: Number.NaN })).toThrow(RangeError)
    expect(() => compileTransition({ ...transition, startBeat: 1 })).toThrow(/bar boundary/)
  })
})
