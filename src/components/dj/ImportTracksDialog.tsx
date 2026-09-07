import { useId } from 'react'

export type ImportTracksDialogProps = {
  open: boolean
  selectedFiles: readonly File[]
  onFilesSelected: (files: File[]) => void
  onImport: () => void
  onClose: () => void
  busy?: boolean
  error?: string
}

export function ImportTracksDialog({
  open,
  selectedFiles,
  onFilesSelected,
  onImport,
  onClose,
  busy = false,
  error,
}: ImportTracksDialogProps) {
  const titleId = useId()
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="rounded-xl border border-tint-border bg-tint-panel p-4 shadow-lg"
    >
      <h2 id={titleId} className="text-lg font-semibold">Import local tracks</h2>
      <p className="mt-1 text-sm text-tint-muted">
        Audio stays in this browser and is not uploaded.
      </p>
      <label className="mt-4 block rounded-lg border border-dashed border-tint-border p-4 text-sm">
        <span className="font-medium">Choose audio files</span>
        <input
          className="mt-2 block w-full text-sm"
          type="file"
          multiple
          accept="audio/*,.wav,.mp3,.flac,.m4a,.ogg,.opus"
          disabled={busy}
          onChange={(event) => onFilesSelected(Array.from(event.currentTarget.files ?? []))}
        />
      </label>
      {selectedFiles.length > 0 && (
        <ul aria-label="Selected tracks" className="mt-3 space-y-1 text-sm">
          {selectedFiles.map((file) => <li key={`${file.name}-${file.size}`}>{file.name}</li>)}
        </ul>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-tint-danger">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy || selectedFiles.length === 0}
          className="rounded-md bg-tint-accent px-3 py-2 text-sm font-medium text-tint-on-accent disabled:opacity-50"
          onClick={onImport}
        >
          {busy ? 'Importing tracks' : 'Import tracks'}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-md border border-tint-border px-3 py-2 text-sm font-medium disabled:opacity-50"
          onClick={onClose}
        >
          Cancel import
        </button>
      </div>
    </div>
  )
}
