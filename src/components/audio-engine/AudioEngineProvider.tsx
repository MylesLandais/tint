import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import type { AudioEngineSnapshot, AudioEngineStore } from './store'

const AudioEngineContext = createContext<AudioEngineStore | null>(null)

export type AudioEngineProviderProps = {
  store: AudioEngineStore
  children: ReactNode
}

export type AudioEngineBinding = {
  snapshot: AudioEngineSnapshot
  audition: AudioEngineStore['audition']
  stop: AudioEngineStore['stop']
  getDiagnostics: AudioEngineStore['getDiagnostics']
}

export function AudioEngineProvider({ store, children }: AudioEngineProviderProps) {
  return (
    <AudioEngineContext.Provider value={store}>
      {children}
    </AudioEngineContext.Provider>
  )
}

export function useAudioEngine(): AudioEngineBinding {
  const store = useContext(AudioEngineContext)
  if (store === null) {
    throw new Error('useAudioEngine must be used inside AudioEngineProvider')
  }
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
  return {
    snapshot,
    audition: store.audition,
    stop: store.stop,
    getDiagnostics: store.getDiagnostics,
  }
}
