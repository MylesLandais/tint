import { describe, expect, it, vi } from 'vitest'
import { createBrowserMidnight128Runtime } from './browserMidnight128Runtime'

class FakeAudioContext {
  state: AudioContextState = 'suspended'
  decodeAudioData = vi.fn()
}

describe('createBrowserMidnight128Runtime', () => {
  it('does not construct an AudioContext until an explicit import or audition action', () => {
    const AudioContext = vi.fn(function AudioContext() { return new FakeAudioContext() })
    const runtime = createBrowserMidnight128Runtime({
      AudioContext: AudioContext as unknown as typeof globalThis.AudioContext,
      AudioWorkletNode: function AudioWorkletNode() {},
      MediaRecorder: function MediaRecorder() {},
    })

    expect(AudioContext).not.toHaveBeenCalled()
    expect(runtime.engineStore.getSnapshot().capabilities).toEqual({
      webAudio: true,
      audioWorklet: true,
      mediaRecorder: true,
    })
    expect(runtime.importStore.getSnapshot().state).toBe('idle')
  })

  it('shares the lazily created context between decoding and the audition backend', () => {
    const context = new FakeAudioContext()
    const AudioContext = vi.fn(function AudioContext() { return context })
    const runtime = createBrowserMidnight128Runtime({
      AudioContext: AudioContext as unknown as typeof globalThis.AudioContext,
    })

    expect(runtime.getOrCreateContext()).toBe(context)
    expect(runtime.getOrCreateContext()).toBe(context)
    expect(AudioContext).toHaveBeenCalledOnce()
  })

  it('exposes unavailable engine state without trying to construct a missing API', () => {
    const runtime = createBrowserMidnight128Runtime({})
    expect(runtime.engineStore.getSnapshot().auditionState).toBe('unavailable')
    expect(() => runtime.getOrCreateContext()).toThrow(/Web Audio is unavailable/)
  })
})
