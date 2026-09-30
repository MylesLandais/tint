/**
 * Following one interaction from the slash command to what the agent said.
 *
 * Two readings of the same spans sit side by side deliberately. The waterfall
 * answers "where did the time go"; the transcript answers "what did it decide".
 * Operators asked the first question and then always asked the second, and
 * making them switch surfaces to get it lost the correlation they came for.
 */
import { useState } from 'react'
import { TraceServiceMap, TraceViewer, formatDuration } from '../../components/telemetry'
import '../../components/graph/graph.css'
import { Badge } from '../../components/badge'
import type { BadgeTone } from '../../components/badge'
import { Card, Surface } from '../../components/surface'
import { EmptyState } from '../../components/status'
import { conversationFromTrace } from './correlation'
import type { ConversationTurn, CorrelationBundle } from './types'
import { formatMs, formatTickAge } from './fixtures'

const ROLE_TONES: Record<ConversationTurn['role'], BadgeTone> = {
  user: 'accent',
  agent: 'info',
  tool: 'neutral',
  model: 'success',
}

const ROLE_LABELS: Record<ConversationTurn['role'], string> = {
  user: 'user',
  agent: 'agent',
  tool: 'tool',
  model: 'model',
}

export function ConversationTranscript({
  bundle,
  selectedSpanId,
  onSelectedSpanIdChange,
}: {
  bundle: CorrelationBundle | null
  selectedSpanId: string | null
  onSelectedSpanIdChange: (spanId: string | null) => void
}) {
  const turns = conversationFromTrace(bundle?.trace ?? null)
  if (turns.length === 0) {
    return (
      <EmptyState
        title="No conversation recorded"
        description="This interaction was answered without an agent turn, or its trace never arrived."
      />
    )
  }

  return (
    <ol className="m-0 grid list-none gap-2 p-0" aria-label="Agent conversation">
      {turns.map((turn) => {
        const selected = turn.spanId === selectedSpanId
        return (
          <li key={turn.spanId}>
            {/*
              A button rather than a click handler on the row: selecting a turn
              also selects its span in the waterfall, so it has to be reachable
              from the keyboard like any other control.
            */}
            <button
              type="button"
              onClick={() => onSelectedSpanIdChange(selected ? null : turn.spanId)}
              aria-pressed={selected}
              className={`w-full cursor-pointer rounded-lg border p-3 text-left ${
                selected ? 'border-tint-accent bg-tint-accent/5' : 'border-tint-border bg-transparent'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={turn.failed ? 'danger' : ROLE_TONES[turn.role]}>{ROLE_LABELS[turn.role]}</Badge>
                <code className="text-xs">{turn.label}</code>
                <span className="ml-auto text-xs text-tint-muted">
                  +{formatDuration(turn.startMs)} · {formatDuration(turn.durationMs)}
                </span>
              </div>
              <p className={`m-0 mt-2 text-sm ${turn.failed ? 'text-tint-danger' : ''}`}>{turn.text}</p>
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** The full trace surface for one correlation id. */
export function ConversationTraceView({ bundle }: { bundle: CorrelationBundle | null }) {
  const [spanId, setSpanId] = useState<string | null>(null)

  if (!bundle) {
    return (
      <EmptyState
        title="Nothing selected"
        description="Pick a slash command from the feed to follow what the agent did with it."
      />
    )
  }

  const interaction = bundle.interaction

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <Surface className="grid gap-1 p-4">
        <p className="m-0 text-xs uppercase tracking-wide text-tint-muted">Correlation {bundle.correlationId}</p>
        <p className="m-0 text-lg font-medium">
          /{interaction ? (interaction.subcommand ? `${interaction.command} ${interaction.subcommand}` : interaction.command) : 'unknown'}
        </p>
        {interaction ? (
          <p className="m-0 text-sm text-tint-muted">
            {interaction.actor} in #{interaction.channel} · {formatTickAge(interaction.tick)} ·{' '}
            {formatMs(interaction.latencyMs)} · {interaction.agent ?? 'handled inline'}
          </p>
        ) : null}
        {interaction?.error ? <p className="m-0 mt-1 text-sm text-tint-danger">{interaction.error}</p> : null}
      </Surface>

      {bundle.trace ? (
        <>
          <Card header="Where the time went">
            <TraceViewer trace={bundle.trace} selectedSpanId={spanId} onSelectedSpanIdChange={setSpanId} />
          </Card>
          <Card header="What the agent said">
            <ConversationTranscript bundle={bundle} selectedSpanId={spanId} onSelectedSpanIdChange={setSpanId} />
          </Card>
          <Card header="Services this interaction touched">
            <TraceServiceMap trace={bundle.trace} />
          </Card>
        </>
      ) : (
        <EmptyState
          title="No trace for this correlation id"
          description="The interaction was recorded but its spans never arrived. The linked records below are all there is."
        />
      )}

      <LinkedRecords bundle={bundle} />
    </div>
  )
}

/** Everything else recorded under the same correlation id. */
export function LinkedRecords({ bundle }: { bundle: CorrelationBundle | null }) {
  if (!bundle) return <EmptyState title="Nothing selected" />
  const empty = bundle.audit.length === 0 && bundle.moderation.length === 0

  return (
    <Card header="Linked records" actions={<code className="text-xs break-all">{bundle.correlationId}</code>}>
      {empty ? (
        <EmptyState title="No other subsystem recorded this id" />
      ) : (
        <ol className="m-0 grid list-none gap-3 p-0">
          {/*
            Stacked rather than a single row: this list lives in the inspector,
            and at that width an action name and its actor competing for one
            line left neither of them readable.
          */}
          {bundle.moderation.map((event) => (
            <li key={event.id} className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={event.automated ? 'warning' : 'neutral'}>{event.kind}</Badge>
              </div>
              <p className="m-0 text-sm break-words">{event.detail}</p>
              <span className="text-xs text-tint-muted">
                {event.actor}
                {event.subject ? ` → ${event.subject}` : ''} · {formatTickAge(event.tick)}
              </span>
            </li>
          ))}
          {bundle.audit.map((row) => (
            <li key={row.id} className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral">audit</Badge>
                <code className="min-w-0 break-all text-xs">{row.action}</code>
              </div>
              <span className="text-xs text-tint-muted">
                {row.actor} · {formatTickAge(row.tick)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
