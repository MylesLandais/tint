import { describe, expect, it } from 'vitest'
import vectors from './golden.json'
import { SessionFixture } from './fakeSession'
describe('Rust session examples', () => {
  it('replays every command and injected clock snapshot without sharing mutable data', () => {
    const fixture = new SessionFixture()
    expect(fixture.state).toEqual(vectors.initial)
    for (const step of vectors.steps) {
      expect(fixture.advance()).toEqual(step.expected)
      expect(fixture.step?.now_ms).toBe(step.now_ms)
      expect(fixture.step?.command).toEqual(step.command)
    }
    fixture.state.title = 'untrusted viewer edit'
    expect(fixture.state.title).toBe('Film')
    expect(fixture.reset()).toEqual(vectors.initial)
  })
  it('keeps the playing no-op, stale completion fence, intentional pause and expiry examples', () => {
    const steps = vectors.steps
    expect(steps[3]!.expected.playback).toEqual(steps[2]!.expected.playback)
    expect(steps[3]!.expected.session_revision).toBe(steps[2]!.expected.session_revision)
    expect(steps[5]!.expected.playback.playback_instance_id).toBe(steps[4]!.expected.playback.playback_instance_id)
    expect(steps[8]!.expected.playback.state).toBe('paused')
    expect(steps.at(-1)!.expected.ended_reason).toBe('idle_expiry')
  })
})
