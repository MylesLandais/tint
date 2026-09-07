import { useMemo, useState } from 'react'
import { Badge } from '../badge'
import { Button } from '../button'
import { cn } from '../../lib/utils'
import type { FeedEntry } from '../feed/contracts'
import { countMatches, mockDryRun, type PolicyRule } from './contracts'

export type PolicyDryRunProps = {
  rule: Pick<PolicyRule, 'criteria' | 'disposition' | 'enabled' | 'name'>
  entries: readonly FeedEntry[]
  className?: string
}

/**
 * Pick a fixture FeedEntry, run `mockDryRun`, show the result.
 *
 * Builder clauses evaluate for real; Lua returns fixture-scripted results — no
 * Lua VM ships in the browser.
 */
export function PolicyDryRun({ rule, entries, className }: PolicyDryRunProps) {
  const [entryId, setEntryId] = useState(entries[0]?.id ?? '')
  const entry = entries.find((item) => item.id === entryId) ?? entries[0]
  const [result, setResult] = useState(() =>
    entry ? mockDryRun(entry, rule) : { matched: false, note: 'No entries.' },
  )

  const matchTotal = useMemo(() => countMatches(entries, rule), [entries, rule])

  return (
    <div
      data-tint-policy-dry-run=""
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-tint-border bg-tint-panel p-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-tint-muted">Fixture entry</span>
          <select
            className="rounded-md border border-tint-border bg-tint-surface px-2 py-1.5 text-sm"
            value={entry?.id ?? ''}
            onChange={(event) => setEntryId(event.target.value)}
          >
            {entries.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <Button
          size="sm"
          variant="primary"
          disabled={!entry}
          onClick={() => {
            if (entry) setResult(mockDryRun(entry, rule))
          }}
        >
          Run dry-run
        </Button>
      </div>

      <p className="m-0 text-xs text-tint-muted">
        Builder / mocked Lua would match <strong className="text-tint-ink">{matchTotal}</strong> of{' '}
        {entries.length} fixture entries for “{rule.name}”.
      </p>

      <div className="rounded-lg border border-tint-border bg-tint-surface p-3 text-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone={result.matched ? 'success' : 'neutral'}>
            {result.matched ? 'matched' : 'no match'}
          </Badge>
          {result.disposition ? <Badge tone="accent">{result.disposition}</Badge> : null}
        </div>
        {result.note ? <p className="m-0 text-tint-muted">{result.note}</p> : null}
      </div>
    </div>
  )
}
