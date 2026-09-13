import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type ImportReviewRow = {
  id: string
  label: string
  files: number
  ready: number
  errors: number
}

export type ImportReviewProps = {
  rows: readonly ImportReviewRow[]
  title?: string
  description?: ReactNode
  notice?: ReactNode
  error?: ReactNode
  busy?: boolean
  disabled?: boolean
  complete?: boolean
  onImport: () => void
  className?: string
}

/** Controlled review of a lossless import. Preserved files and usable records
 * are separate counts; the caller owns preview, persistence, and completion. */
export function ImportReview({ rows, title = 'Review import', description, notice, error,
  busy = false, disabled = false, complete = false, onImport, className }: ImportReviewProps) {
  const files = rows.reduce((sum, row) => sum + row.files, 0)
  return <section aria-label={title} aria-busy={busy} className={cn('space-y-3 rounded-lg border border-tint-border bg-tint-panel p-4', className)}>
    <h3 className="font-semibold text-tint-ink">{title}</h3>
    {description && <p className="text-sm text-tint-muted">{description}</p>}
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm [&_th]:pr-3 [&_td]:pr-3">
        <caption className="sr-only">Import file coverage</caption>
        <thead><tr><th scope="col">Data</th><th scope="col">Files preserved</th><th scope="col">Ready to use</th><th scope="col">Read errors</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.id} className="border-t border-tint-border">
          <th scope="row" className="py-2 font-normal">{row.label}</th><td>{row.files}</td><td>{row.ready}</td><td>{row.errors}</td>
        </tr>)}</tbody>
      </table>
    </div>
    {notice && <div className="text-sm text-tint-muted">{notice}</div>}
    {error && <div role="alert">{error}</div>}
    {complete ? <p role="status">Import saved.</p> : <button type="button"
      className="rounded-md border border-tint-border px-3 py-2 text-sm disabled:opacity-50"
      disabled={disabled || busy || files === 0} onClick={onImport}>
      {busy ? 'Importing…' : `Import ${files} files`}
    </button>}
  </section>
}
