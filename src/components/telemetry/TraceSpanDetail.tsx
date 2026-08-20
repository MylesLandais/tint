import { cn } from '../../lib/utils'
import { durationOf, formatDuration, serviceColor } from './layout'
import type { TraceSpanDetailProps } from './types'

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="m-0 overflow-x-auto rounded-lg border border-tint-border bg-tint-surface p-2 font-mono text-[0.6875rem] leading-5 text-tint-ink">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

function Field({ label, children }: { label: string; children: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.625rem] font-medium tracking-wide text-tint-muted uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-mono text-xs text-tint-ink">{children}</dd>
    </div>
  )
}

export function TraceSpanDetail({ span, className }: TraceSpanDetailProps) {
  if (!span) {
    return (
      <div
        data-trace-span-detail=""
        className={cn(
          'rounded-xl border border-dashed border-tint-border bg-tint-panel px-3 py-6 text-sm text-tint-muted',
          className,
        )}
      >
        Select a span in the waterfall to inspect input, output, and attributes.
      </div>
    )
  }

  const entries = Object.entries(span.attributes ?? {})

  return (
    <article
      data-trace-span-detail=""
      className={cn('rounded-xl border border-tint-border bg-tint-panel p-3', className)}
    >
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-tint-ink">{span.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.6875rem] text-tint-muted">
            <span
              className="size-2 rounded-full"
              style={{ background: serviceColor(span.service) }}
              aria-hidden="true"
            />
            {span.service}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase',
            span.status === 'error'
              ? 'bg-tint-danger-soft text-tint-danger-ink'
              : 'bg-tint-success-soft text-tint-success-ink',
          )}
        >
          {span.status}
        </span>
      </header>

      <dl className="mb-3 grid grid-cols-2 gap-2">
        <Field label="Duration">{formatDuration(durationOf(span))}</Field>
        <Field label="Kind">{span.kind}</Field>
        <Field label="Span">{span.spanId}</Field>
        <Field label="Parent">{span.parentSpanId ?? '—'}</Field>
      </dl>

      {entries.length > 0 ? (
        <section className="mb-3">
          <h4 className="mb-1.5 text-[0.625rem] font-medium tracking-wide text-tint-muted uppercase">
            Attributes
          </h4>
          <dl className="grid gap-1">
            {entries.map(([key, value]) => (
              <div key={key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-[0.6875rem]">
                <dt className="truncate font-mono text-tint-muted">{key}</dt>
                <dd className="truncate font-mono text-tint-ink">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {span.input !== undefined ? (
        <section className="mb-3">
          <h4 className="mb-1.5 text-[0.625rem] font-medium tracking-wide text-tint-muted uppercase">
            Input
          </h4>
          <JsonBlock value={span.input} />
        </section>
      ) : null}

      {span.output !== undefined ? (
        <section className="mb-3">
          <h4 className="mb-1.5 text-[0.625rem] font-medium tracking-wide text-tint-muted uppercase">
            Output
          </h4>
          <JsonBlock value={span.output} />
        </section>
      ) : null}

      {span.events && span.events.length > 0 ? (
        <section>
          <h4 className="mb-1.5 text-[0.625rem] font-medium tracking-wide text-tint-muted uppercase">
            Events
          </h4>
          <ul className="m-0 list-none space-y-1 p-0">
            {span.events.map((event, index) => (
              <li
                key={`${event.name}-${index}`}
                className="rounded-md bg-tint-surface px-2 py-1 font-mono text-[0.6875rem] text-tint-ink"
              >
                {event.name}
                <span className="text-tint-muted"> @ {formatDuration(event.timeMs)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
