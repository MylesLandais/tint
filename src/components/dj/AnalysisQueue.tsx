export type AnalysisQueueStatus = 'queued' | 'decoding' | 'ready' | 'error'

export type AnalysisQueueItem = {
  id: string
  fileName: string
  status: AnalysisQueueStatus
  durationSeconds?: number
  error?: string
}

export type AnalysisQueueProps = {
  items: readonly AnalysisQueueItem[]
  onRetry: (id: string) => void
  className?: string
}

export function AnalysisQueue({ items, onRetry, className }: AnalysisQueueProps) {
  const ready = items.filter((item) => item.status === 'ready').length
  return (
    <section aria-label="Track analysis queue" className={className}>
      <p role="status" className="text-sm text-tint-muted">
        {ready} of {items.length} tracks ready
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.id} className="rounded-md border border-tint-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{item.fileName}</span>
              <span className="text-sm text-tint-muted">
                {item.status === 'queued' && 'Queued'}
                {item.status === 'decoding' && 'Decoding'}
                {item.status === 'ready' && formatDuration(item.durationSeconds)}
                {item.status === 'error' && 'Failed'}
              </span>
            </div>
            {item.status === 'error' && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span role="alert" className="text-sm text-tint-danger">
                  {item.error ?? 'Track analysis failed'}
                </span>
                <button
                  type="button"
                  className="rounded-md border border-tint-border px-2 py-1 text-sm"
                  onClick={() => onRetry(item.id)}
                >
                  Retry {item.fileName}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function formatDuration(duration: number | undefined): string {
  if (!Number.isFinite(duration) || duration === undefined || duration < 0) return 'Ready'
  const rounded = Math.round(duration)
  const minutes = Math.floor(rounded / 60)
  return `${minutes}:${String(rounded % 60).padStart(2, '0')}`
}
