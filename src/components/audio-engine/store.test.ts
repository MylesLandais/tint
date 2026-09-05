import { describe, expect, it, vi } from 'vitest'
import type { CompiledTransition } from '../dj/contracts'
import { createAudioEngineStore, probeAudioCapabilities } from './store'

const schedule: CompiledTransition = {
  transitionId: 'a--b',
  startBeat: 0,
  endBeat: 64,
  durationBeats: 64,
  durationSeconds: 30,
  effectTailBeats: 0,
  lanes: {},
}

describe('audio engine store', () => {
  it('publishes immutable coarse snapshots around an audition lifecycle', async () => {
    let resolveStart: (() => void) | undefined
    const backend = {
      startAudition: vi.fn(() => new Promise<void>((resolve) => { resolveStart = resolve })),
      stopAudition: vi.fn(async () => undefined),
      getDiagnostics: vi.fn(() => ({
        contextState: 'running' as const,
        scheduledAutomationEvents: 4,
        beatAlignmentErrorMs: 0,
        peakDbfs: -3,
        rmsDbfs: -12,
        droppedWorkletBlocks: 0,
        invalidParameterValues: 0,
      })),
    }
    const store = createAudioEngineStore({
      capabilities: { webAudio: true, audioWorklet: true, mediaRecorder: false },
      backend,
    })
    const snapshots: string[] = []
    const unsubscribe = store.subscribe(() => snapshots.push(store.getSnapshot().auditionState))

    const start = store.audition(schedule)
    expect(store.getSnapshot()).toMatchObject({ auditionState: 'loading', activeTransitionId: 'a--b' })
    resolveStart?.()
    await start
    expect(store.getSnapshot()).toMatchObject({ auditionState: 'playing', activeTransitionId: 'a--b' })
    expect(store.getDiagnostics().scheduledAutomationEvents).toBe(4)

    await store.stop()
    expect(store.getSnapshot()).toMatchObject({ auditionState: 'idle', activeTransitionId: undefined })
    expect(snapshots).toEqual(['loading', 'playing', 'idle'])
    unsubscribe()
  })

  it('cancels stale audition completion after stop', async () => {
    let resolveStart: (() => void) | undefined
    const backend = {
      startAudition: vi.fn(() => new Promise<void>((resolve) => { resolveStart = resolve })),
      stopAudition: vi.fn(async () => undefined),
      getDiagnostics: vi.fn(() => ({
        contextState: 'suspended' as const,
        scheduledAutomationEvents: 0,
        beatAlignmentErrorMs: 0,
        peakDbfs: Number.NEGATIVE_INFINITY,
        rmsDbfs: Number.NEGATIVE_INFINITY,
        droppedWorkletBlocks: 0,
        invalidParameterValues: 0,
      })),
    }
    const store = createAudioEngineStore({
      capabilities: { webAudio: true, audioWorklet: false, mediaRecorder: false },
      backend,
    })

    const pending = store.audition(schedule)
    await store.stop()
    resolveStart?.()
    await pending

    expect(store.getSnapshot()).toMatchObject({ auditionState: 'idle' })
    expect(store.getSnapshot().activeTransitionId).toBeUndefined()
  })

  it('does not call the backend when Web Audio is unavailable', async () => {
    const backend = {
      startAudition: vi.fn(async () => undefined),
      stopAudition: vi.fn(async () => undefined),
      getDiagnostics: vi.fn(),
    }
    const store = createAudioEngineStore({
      capabilities: { webAudio: false, audioWorklet: false, mediaRecorder: false },
      backend,
    })

    await store.audition(schedule)
    expect(store.getSnapshot().auditionState).toBe('unavailable')
    expect(backend.startAudition).not.toHaveBeenCalled()
  })

  it('probes optional browser audio capabilities without constructing an AudioContext', () => {
    const AudioContext = vi.fn()
    expect(probeAudioCapabilities({
      AudioContext,
      AudioWorkletNode: class {},
      MediaRecorder: class {},
    })).toEqual({ webAudio: true, audioWorklet: true, mediaRecorder: true })
    expect(AudioContext).not.toHaveBeenCalled()
    expect(probeAudioCapabilities({})).toEqual({
      webAudio: false,
      audioWorklet: false,
      mediaRecorder: false,
    })
  })
})
