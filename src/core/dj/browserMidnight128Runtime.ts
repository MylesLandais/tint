import { AudioBufferRegistry } from '../audio-engine/AudioBufferRegistry'
import { WebAudioAuditionBackend } from '../audio-engine/WebAudioAuditionBackend'
import {
  createAudioEngineStore,
  probeAudioCapabilities,
  type AudioCapabilityEnvironment,
  type AudioEngineBackend,
  type AudioEngineDiagnostics,
  type AudioEngineStore,
} from '../audio-engine/store'
import { createTrackImportStore, type TrackImportStore } from '../audio-engine/trackImportStore'
import type { CompiledTransition } from './contracts'
import { identifyMidnight128Track } from './midnight128'

export type BrowserAudioEnvironment = AudioCapabilityEnvironment & {
  AudioContext?: typeof globalThis.AudioContext
  webkitAudioContext?: typeof globalThis.AudioContext
}

export type BrowserMidnight128Runtime = {
  registry: AudioBufferRegistry
  importStore: TrackImportStore
  engineStore: AudioEngineStore
  getOrCreateContext: () => AudioContext
  /** Stop playback and close an initialized AudioContext; safe to call more than once. */
  dispose: () => Promise<void>
}

export function createBrowserMidnight128Runtime(
  environment: BrowserAudioEnvironment = globalThis,
): BrowserMidnight128Runtime {
  const capabilities = probeAudioCapabilities(environment)
  const registry = new AudioBufferRegistry()
  let context: AudioContext | undefined
  let auditionBackend: WebAudioAuditionBackend | undefined
  let disposed = false
  let disposal: Promise<void> | undefined

  const getOrCreateContext = (): AudioContext => {
    if (disposed) throw new Error('Midnight 128 audio runtime is disposed')
    if (context) return context
    const Constructor = environment.AudioContext ?? environment.webkitAudioContext
    if (!Constructor) throw new Error('Web Audio is unavailable in this browser')
    context = new Constructor()
    return context
  }

  const backend: AudioEngineBackend = {
    async startAudition(schedule: CompiledTransition) {
      if (disposed) throw new Error('Midnight 128 audio runtime is disposed')
      if (!auditionBackend) {
        auditionBackend = new WebAudioAuditionBackend({
          context: getOrCreateContext(),
          resolveBuffers: (transitionId) => registry.resolveTransition(transitionId),
        })
      }
      await auditionBackend.startAudition(schedule)
    },
    async stopAudition() {
      await auditionBackend?.stopAudition()
    },
    getDiagnostics(): AudioEngineDiagnostics {
      return auditionBackend?.getDiagnostics() ?? {
        contextState: context?.state ?? 'unavailable',
        scheduledAutomationEvents: 0,
        beatAlignmentErrorMs: 0,
        peakDbfs: Number.NEGATIVE_INFINITY,
        rmsDbfs: Number.NEGATIVE_INFINITY,
        droppedWorkletBlocks: 0,
        invalidParameterValues: 0,
      }
    },
  }

  const engineStore = createAudioEngineStore({ capabilities, backend })
  const importStore = createTrackImportStore({
    registry,
    createDecoder: getOrCreateContext,
    identify: identifyMidnight128Track,
  })

  const dispose = (): Promise<void> => {
    if (disposal) return disposal
    disposed = true
    disposal = (async () => {
      try {
        await engineStore.stop()
        await auditionBackend?.dispose()
      } finally {
        if (context && context.state !== 'closed') await context.close()
      }
    })()
    return disposal
  }

  return {
    registry,
    getOrCreateContext,
    importStore,
    engineStore,
    dispose,
  }
}
