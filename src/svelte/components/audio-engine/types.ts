import type { Snippet } from 'svelte'
import type { AudioEngineStore } from '../../../core/audio-engine/store'

export type AudioEngineProviderProps = { store: AudioEngineStore; children?: Snippet }
