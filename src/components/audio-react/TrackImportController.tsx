import { useSyncExternalStore } from 'react'
import { AnalysisQueue } from '../dj/AnalysisQueue'
import { ImportTracksDialog } from '../dj/ImportTracksDialog'
import type { TrackImportStore } from '../audio-engine/trackImportStore'

export type TrackImportControllerProps = {
  open: boolean
  store: TrackImportStore
  onClose: () => void
}

export function TrackImportController({ open, store, onClose }: TrackImportControllerProps) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  return (
    <div className="space-y-4">
      <ImportTracksDialog
        open={open}
        selectedFiles={snapshot.selectedFiles}
        busy={snapshot.state === 'importing'}
        error={snapshot.error}
        onFilesSelected={store.selectFiles}
        onImport={() => { void store.importSelected() }}
        onClose={onClose}
      />
      {snapshot.items.length > 0 && (
        <AnalysisQueue
          items={snapshot.items}
          onRetry={() => { void store.importSelected() }}
        />
      )}
    </div>
  )
}
