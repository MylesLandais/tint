import type { CompiledTransition } from '../dj/contracts'

export type AudioCapabilities = {
  webAudio: boolean
  audioWorklet: boolean
  mediaRecorder: boolean
}

export type AudioCapabilityEnvironment = {
  AudioContext?: unknown
  webkitAudioContext?: unknown
  AudioWorkletNode?: unknown
  MediaRecorder?: unknown
}

export function probeAudioCapabilities(
  environment: AudioCapabilityEnvironment = globalThis,
): AudioCapabilities {
  return {
    webAudio: typeof environment.AudioContext === 'function'
      || typeof environment.webkitAudioContext === 'function',
    audioWorklet: typeof environment.AudioWorkletNode === 'function',
    mediaRecorder: typeof environment.MediaRecorder === 'function',
  }
}

export type AudioEngineDiagnostics = {
  contextState: AudioContextState | 'unavailable'
  scheduledAutomationEvents: number
  beatAlignmentErrorMs: number
  peakDbfs: number
  rmsDbfs: number
  droppedWorkletBlocks: number
  invalidParameterValues: number
  lastEngineError?: string
}

export type AudioEngineSnapshot = {
  auditionState: 'idle' | 'loading' | 'playing' | 'unavailable' | 'error'
  activeTransitionId?: string
  capabilities: AudioCapabilities
  error?: string
}

export type AudioEngineBackend = {
  startAudition: (schedule: CompiledTransition) => Promise<void>
  stopAudition: () => Promise<void>
  getDiagnostics: () => AudioEngineDiagnostics
}

export type AudioEngineStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => AudioEngineSnapshot
  getDiagnostics: () => AudioEngineDiagnostics
  audition: (schedule: CompiledTransition) => Promise<void>
  stop: () => Promise<void>
}

export type CreateAudioEngineStoreOptions = {
  capabilities: AudioCapabilities
  backend: AudioEngineBackend
}

export function createAudioEngineStore({
  capabilities,
  backend,
}: CreateAudioEngineStoreOptions): AudioEngineStore {
  const listeners = new Set<() => void>()
  let snapshot: AudioEngineSnapshot = {
    auditionState: capabilities.webAudio ? 'idle' : 'unavailable',
    capabilities: { ...capabilities },
  }
  let operation = 0

  const publish = (next: AudioEngineSnapshot) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    getDiagnostics: () => backend.getDiagnostics(),
    async audition(schedule) {
      if (!capabilities.webAudio) return
      const currentOperation = ++operation
      publish({ ...snapshot, auditionState: 'loading', activeTransitionId: schedule.transitionId, error: undefined })
      try {
        await backend.startAudition(schedule)
        if (currentOperation !== operation) return
        publish({ ...snapshot, auditionState: 'playing' })
      } catch (error) {
        if (currentOperation !== operation) return
        publish({
          ...snapshot,
          auditionState: 'error',
          activeTransitionId: undefined,
          error: error instanceof Error ? error.message : 'Transition audition failed',
        })
      }
    },
    async stop() {
      operation += 1
      await backend.stopAudition()
      publish({ ...snapshot, auditionState: 'idle', activeTransitionId: undefined, error: undefined })
    },
  }
}
