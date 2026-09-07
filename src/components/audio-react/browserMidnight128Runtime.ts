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
import type { CompiledTransition } from '../dj/contracts'
import { identifyMidnight128Track } from '../dj/midnight128'

export type BrowserAudioEnvironment = AudioCapabilityEnvironment & {
  AudioContext?: typeof globalThis.AudioContext
  webkitAudioContext?: typeof globalThis.AudioContext
}

export type BrowserMidnight128Runtime = {
  registry: AudioBufferRegistry
  importStore: TrackImportStore
  engineStore: AudioEngineStore
  getOrCreateContext: () => AudioContext
}

export function createBrowserMidnight128Runtime(
  environment: BrowserAudioEnvironment = globalThis,
): BrowserMidnight128Runtime {
  const capabilities = probeAudioCapabilities(environment)
  const registry = new AudioBufferRegistry()
  let context: AudioContext | undefined
  let auditionBackend: WebAudioAuditionBackend | undefined

  const getOrCreateContext = (): AudioContext => {
    if (context) return context
    const Constructor = environment.AudioContext ?? environment.webkitAudioContext
    if (!Constructor) throw new Error('Web Audio is unavailable in this browser')
    context = new Constructor()
    return context
  }

  const backend: AudioEngineBackend = {
    async startAudition(schedule: CompiledTransition) {
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

  return {
    registry,
    getOrCreateContext,
    importStore: createTrackImportStore({
      registry,
      createDecoder: getOrCreateContext,
      identify: identifyMidnight128Track,
    }),
    engineStore: createAudioEngineStore({ capabilities, backend }),
  }
}
