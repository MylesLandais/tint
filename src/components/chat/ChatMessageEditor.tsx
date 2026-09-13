import { useId } from 'react'
import { cn } from '../../lib/utils'

export type ChatMessageEditorProps = {
  value: string
  onValueChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  busy?: boolean
  error?: string
  label?: string
  maxLength?: number
  className?: string
}

/** Controlled inline edit form. The host owns persistence and conflict handling. */
export function ChatMessageEditor({ value, onValueChange, onSave, onCancel,
  busy = false, error, label = 'Edit message', maxLength, className }: ChatMessageEditorProps) {
  const id = useId()
  const button = 'rounded border border-tint-border px-3 py-1.5 text-sm hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-tint-accent disabled:opacity-40'
  return (
    <form className={cn('flex min-w-0 flex-col gap-2 py-2', className)} aria-busy={busy}
      onSubmit={(event) => { event.preventDefault(); if (!busy && value.trim()) onSave() }}>
      <label htmlFor={id} className="text-xs font-medium">{label}</label>
      <textarea id={id} value={value} maxLength={maxLength} disabled={busy} rows={5}
        aria-describedby={error ? `${id}-error` : undefined} aria-invalid={Boolean(error)}
        className="w-full min-w-0 resize-y rounded border border-tint-border bg-tint-panel p-2 text-sm text-tint-ink focus-visible:outline-2 focus-visible:outline-tint-accent"
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel() }
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); if (!busy && value.trim()) onSave() }
        }} />
      {error ? <p id={`${id}-error`} role="alert" className="text-sm text-tint-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={button} disabled={busy || !value.trim()}>{busy ? 'Saving…' : 'Save message'}</button>
        <button type="button" className={button} disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
