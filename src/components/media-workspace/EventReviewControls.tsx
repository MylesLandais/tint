import { useId } from 'react'

export interface EventReviewOption {
  /** Stable host-owned ID; labels need not be unique. */
  id: string
  label: string
}

export interface EventReviewControlsProps {
  quickFilters: readonly EventReviewOption[]
  selectedQuickFilterId: string | null
  onQuickFilterChange: (id: string) => void
  /** Calendar/history date only. The host supplies timezone-aware presentation. */
  historyDate?: { dateTime: string; label: string } | null
  /** Offset in the media, in seconds. Never derived from historyDate. */
  mediaTimestampSeconds?: number | null
  onSeek?: (seconds: number) => void
  candidatePeople: readonly EventReviewOption[]
  /** Unknown IDs remain visible and removable, and survive other selections. */
  selectedCandidatePersonIds: readonly string[]
  onCandidatePersonIdsChange: (ids: string[]) => void
  disabled?: boolean
  className?: string
}

const controlClass = 'min-h-11 rounded-md border border-tint-border bg-tint-surface px-3 text-sm text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent disabled:opacity-50'

/** Controlled review intents only: no fetching, identity inference, persistence or training approval. */
export function EventReviewControls({
  quickFilters, selectedQuickFilterId, onQuickFilterChange, historyDate,
  mediaTimestampSeconds, onSeek, candidatePeople, selectedCandidatePersonIds,
  onCandidatePersonIdsChange, disabled = false, className,
}: EventReviewControlsProps) {
  const warningId = useId()
  const validTimestamp = typeof mediaTimestampSeconds === 'number'
    && Number.isFinite(mediaTimestampSeconds) && mediaTimestampSeconds >= 0
  const seconds = validTimestamp ? mediaTimestampSeconds : null
  const timestamp = seconds === null ? null : `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  const people = [...new Map(candidatePeople.map(person => [person.id, person])).values()]
  const knownIds = new Set(people.map(person => person.id))
  for (const id of new Set(selectedCandidatePersonIds)) {
    if (!knownIds.has(id)) people.push({ id, label: `Unknown person (${id})` })
  }
  return (
    <section aria-label="Event review controls" className={`space-y-4 rounded-lg border border-tint-border bg-tint-panel p-4 text-tint-ink ${className ?? ''}`}>
      <fieldset disabled={disabled} className="space-y-2">
        <legend className="text-sm font-medium">Quick filters</legend>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map(filter => (
            <button key={filter.id} type="button" disabled={disabled} aria-pressed={selectedQuickFilterId === filter.id}
              className={`${controlClass} aria-pressed:bg-tint-accent-soft`} onClick={() => onQuickFilterChange(filter.id)}>
              {filter.label}
            </button>
          ))}
        </div>
      </fieldset>
      <dl className="flex flex-wrap gap-4 text-sm">
        <div><dt className="text-tint-muted">History date</dt><dd>
          {historyDate ? <time dateTime={historyDate.dateTime}>{historyDate.label}</time> : 'History date unavailable'}
        </dd></div>
        <div><dt className="text-tint-muted">Media timestamp</dt><dd>
          {seconds === null ? 'Media timestamp unavailable' : onSeek ? (
            <button type="button" disabled={disabled} className={controlClass} aria-label={`Seek to ${timestamp}`} onClick={() => onSeek(seconds)}>{timestamp}</button>
          ) : <span>{timestamp}</span>}
        </dd></div>
      </dl>
      <fieldset disabled={disabled} aria-describedby={warningId} className="space-y-2">
        <legend className="text-sm font-medium">Candidate people</legend>
        <p id={warningId} className="text-sm text-tint-muted">Review required · Training not approved. Candidate selection is not identity confirmation or training consent.</p>
        <div className="flex flex-wrap gap-2">
          {people.map(person => (
            <label key={person.id} className="flex min-h-11 items-center gap-2 rounded-md border border-tint-border px-3 text-sm">
              <input type="checkbox" disabled={disabled} checked={selectedCandidatePersonIds.includes(person.id)}
                onChange={event => onCandidatePersonIdsChange(event.target.checked
                  ? [...new Set([...selectedCandidatePersonIds, person.id])]
                  : selectedCandidatePersonIds.filter(id => id !== person.id))} />
              {person.label}
            </label>
          ))}
          {!people.length && <p className="text-sm text-tint-muted">No candidate people available</p>}
        </div>
      </fieldset>
    </section>
  )
}
