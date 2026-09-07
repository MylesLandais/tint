import { decodeLocalAudioFiles, type AudioDecoder } from './decodeLocalAudioFiles'
import type { AudioBufferRegistry } from './AudioBufferRegistry'

export type TrackImportItem = {
  id: string
  fileName: string
  status: 'queued' | 'decoding' | 'ready' | 'error'
  durationSeconds?: number
  error?: string
}

export type TrackImportState = 'idle' | 'selected' | 'importing' | 'ready' | 'error'

export type TrackImportSnapshot = {
  state: TrackImportState
  selectedFiles: readonly File[]
  items: readonly TrackImportItem[]
  error?: string
}

export type TrackImportStore = {
  subscribe: (listener: () => void) => () => void
  getSnapshot: () => TrackImportSnapshot
  selectFiles: (files: readonly File[]) => void
  importSelected: () => Promise<void>
}

export type CreateTrackImportStoreOptions = {
  registry: AudioBufferRegistry
  createDecoder: () => AudioDecoder
  identify: (file: File, index: number) => string
}

export function createTrackImportStore({
  registry,
  createDecoder,
  identify,
}: CreateTrackImportStoreOptions): TrackImportStore {
  const listeners = new Set<() => void>()
  let snapshot: TrackImportSnapshot = { state: 'idle', selectedFiles: [], items: [] }

  const publish = (next: TrackImportSnapshot) => {
    snapshot = next
    listeners.forEach((listener) => listener())
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    selectFiles(files) {
      if (snapshot.state === 'importing') throw new Error('Cannot replace files during import')
      const selectedFiles = [...files]
      const items = selectedFiles.map((file, index): TrackImportItem => ({
        id: identify(file, index).trim(),
        fileName: file.name,
        status: 'queued',
      }))
      publish({
        state: selectedFiles.length > 0 ? 'selected' : 'idle',
        selectedFiles,
        items,
      })
    },
    async importSelected() {
      if (snapshot.state === 'importing') throw new Error('Track import is already running')
      if (snapshot.selectedFiles.length === 0) throw new Error('Select at least one audio file')
      const selectedFiles = [...snapshot.selectedFiles]
      const queuedItems = [...snapshot.items]
      publish({
        state: 'importing',
        selectedFiles,
        items: queuedItems.map((item) => ({ ...item, status: 'decoding' })),
      })
      try {
        const decoded = await decodeLocalAudioFiles(
          createDecoder(),
          registry,
          selectedFiles,
          identify,
        )
        publish({
          state: 'ready',
          selectedFiles,
          items: decoded.map((track) => ({
            id: track.trackId,
            fileName: track.fileName,
            status: 'ready',
            durationSeconds: track.durationSeconds,
          })),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Track import failed'
        publish({
          state: 'error',
          selectedFiles,
          error: message,
          items: queuedItems.map((item) => ({
            ...item,
            status: 'error',
            error: message.includes(item.fileName) ? message : 'Import cancelled after another track failed',
          })),
        })
      }
    },
  }
}
