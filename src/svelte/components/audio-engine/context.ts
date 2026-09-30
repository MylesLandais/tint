import { getContext, setContext } from 'svelte'
import type { AudioEngineStore } from '../../../core/audio-engine/store'
import { observeAudioStore } from './bindings'

const KEY = Symbol.for('@nebula/tint/audio-engine')

export type AudioEngineBinding = {
  readonly snapshot: ReturnType<AudioEngineStore['getSnapshot']>
  audition: AudioEngineStore['audition']
  stop: AudioEngineStore['stop']
  getDiagnostics: AudioEngineStore['getDiagnostics']
}

export function provideAudioEngine(getStore: () => AudioEngineStore): void {
  setContext(KEY, getStore)
}

export function useAudioEngine(): AudioEngineBinding {
  const getStore = getContext<(() => AudioEngineStore) | undefined>(KEY)
  if (!getStore) throw new Error('useAudioEngine must be used inside AudioEngineProvider')
  let observedStore: AudioEngineStore | undefined
  let observed: ReturnType<typeof observeAudioStore<ReturnType<AudioEngineStore['getSnapshot']>>> | undefined
  return {
    get snapshot() {
      const store = getStore()
      if (store !== observedStore) {
        observedStore = store
        observed = observeAudioStore(store)
      }
      return observed!.snapshot
    },
    audition: (schedule) => getStore().audition(schedule),
    stop: () => getStore().stop(),
    getDiagnostics: () => getStore().getDiagnostics(),
  }
}
