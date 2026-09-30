import type { AudioBufferRegistry } from '../../../core/audio-engine/AudioBufferRegistry'
import type { AudioEngineStore } from '../../../core/audio-engine/store'
import type { TrackImportStore } from '../../../core/audio-engine/trackImportStore'

export type TrackImportControllerProps = {
  open: boolean
  store: TrackImportStore
  onClose: () => void
}

export type Midnight128WorkspaceProps = {
  importOpen: boolean
  importStore: TrackImportStore
  registry: AudioBufferRegistry
  engineStore: AudioEngineStore
  onCloseImport: () => void
}
