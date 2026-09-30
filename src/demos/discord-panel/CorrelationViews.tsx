/**
 * The feed, the statistics, and the guild activity list.
 *
 * These are the surfaces shared by both panels. Each one is handed already
 * filtered rows and reports selections upward; none of them holds domain
 * state, so the bot panel and the mod panel can arrange them differently
 * without either one inheriting the other's idea of what is selected.
 */
import { useMemo } from 'react'
import { Badge } from '../../components/badge'
import type { BadgeTone } from '../../components/badge'
import { Button } from '../../components/button'
import { Card, Surface } from '../../components/surface'
import { MetricCard } from '../../components/charts'
import { EmptyState } from '../../components/status'
import { DataTable } from '../../components/table'
import type { TableColumn } from '../../components/table'
import { FormControl, SelectField, TextField } from '../../components/form'
import { FilterBar } from '../../components/shell'
import { commandLabel, commandRollups } from './correlation'
import type { CorrelationFinding } from './correlation'
import type { InteractionStatus, ModerationEvent, SlashInteraction } from './types'
import { formatMs, formatTickAge } from './fixtures'

const STATUS_TONES: Record<InteractionStatus, BadgeTone> = {
  pending: 'neutral',
  deferred: 'info',
  replied: 'success',
  failed: 'danger',
}

// ------------------------------------------------------------------ filters

export type InteractionFilters = {
  command: string
  status: string
  agent: string
  channel: string
  text: string
}

export const EMPTY_FILTERS: InteractionFilters = { command: 'all', status: 'all', agent: 'all', channel: 'all', text: '' }

/**
 * Applies the filter bar to the feed.
 *
 * The free-text term is matched against the actor, the summary and the
 * correlation id — a correlation id pasted from an incident channel is the
 * single most common way an operator arrives at this panel, so it has to find
 * its row without anyone choosing a field first.
 */
export function filterInteractions(
  interactions: readonly SlashInteraction[],
  filters: InteractionFilters,
): readonly SlashInteraction[] {
  const term = filters.text.trim().toLowerCase()
  return interactions.filter((interaction) => {
    if (filters.command !== 'all' && commandLabel(interaction) !== filters.command) return false
    if (filters.status !== 'all' && interaction.status !== filters.status) return false
    if (filters.agent !== 'all' && (interaction.agent ?? 'inline') !== filters.agent) return false
    if (filters.channel !== 'all' && interaction.channel !== filters.channel) return false
    if (term === '') return true
    return (
      interaction.correlationId.toLowerCase().includes(term) ||
      interaction.actor.toLowerCase().includes(term) ||
      interaction.summary.toLowerCase().includes(term) ||
      commandLabel(interaction).toLowerCase().includes(term) ||
      Object.values(interaction.options).some((value) => String(value).toLowerCase().includes(term))
    )
  })
}

export function InteractionFilterBar({
  interactions,
  filters,
  onFiltersChange,
}: {
  /** Unfiltered, so the option lists do not collapse as filters are applied. */
  interactions: readonly SlashInteraction[]
  filters: InteractionFilters
  onFiltersChange: (filters: InteractionFilters) => void
}) {
  const commands = useMemo(
    () => [...new Set(interactions.map(commandLabel))].sort(),
    [interactions],
  )
  const agents = useMemo(
    () => [...new Set(interactions.map((item) => item.agent ?? 'inline'))].sort(),
    [interactions],
  )
  const channels = useMemo(
    () => [...new Set(interactions.map((item) => item.channel))].sort(),
    [interactions],
  )
  const set = (patch: Partial<InteractionFilters>) => onFiltersChange({ ...filters, ...patch })

  return (
    <FilterBar
      actions={
        <Button
          size="sm"
          variant="ghost"
          disabled={JSON.stringify(filters) === JSON.stringify(EMPTY_FILTERS)}
          onClick={() => onFiltersChange(EMPTY_FILTERS)}
        >
          Reset
        </Button>
      }
    >
      <FormControl id="filter-text" label="Find">
        <TextField
          id="filter-text"
          value={filters.text}
          onChange={(text) => set({ text })}
          placeholder="correlation id, actor, or text"
        />
      </FormControl>
      <FormControl id="filter-command" label="Command">
        <SelectField
          id="filter-command"
          value={filters.command}
          onChange={(command) => set({ command })}
          options={[{ value: 'all', label: 'All commands' }, ...commands.map((value) => ({ value, label: `/${value}` }))]}
        />
      </FormControl>
      <FormControl id="filter-status" label="Status">
        <SelectField
          id="filter-status"
          value={filters.status}
          onChange={(status) => set({ status })}
          options={[
            { value: 'all', label: 'Any status' },
            { value: 'replied', label: 'Replied' },
            { value: 'failed', label: 'Failed' },
            { value: 'deferred', label: 'Deferred' },
            { value: 'pending', label: 'Pending' },
          ]}
        />
      </FormControl>
      <FormControl id="filter-agent" label="Agent">
        <SelectField
          id="filter-agent"
          value={filters.agent}
          onChange={(agent) => set({ agent })}
          options={[{ value: 'all', label: 'Any agent' }, ...agents.map((value) => ({ value, label: value }))]}
        />
      </FormControl>
      <FormControl id="filter-channel" label="Channel">
        <SelectField
          id="filter-channel"
          value={filters.channel}
          onChange={(channel) => set({ channel })}
          options={[{ value: 'all', label: 'Any channel' }, ...channels.map((value) => ({ value, label: `#${value}` }))]}
        />
      </FormControl>
    </FilterBar>
  )
}

// --------------------------------------------------------------------- feed

export function InteractionFeed({
  interactions,
  selectedId,
  onSelect,
}: {
  interactions: readonly SlashInteraction[]
  selectedId: string | null
  onSelect: (correlationId: string) => void
}) {
  const columns: readonly TableColumn<SlashInteraction>[] = useMemo(
    () => [
      {
        id: 'command',
        header: 'Command',
        renderCell: (row) => (
          // Selecting a row is what opens its trace, so it is a control, not a
          // cell you happen to be able to click.
          <button
            type="button"
            onClick={() => onSelect(row.correlationId)}
            aria-pressed={row.correlationId === selectedId}
            className={`cursor-pointer border-0 bg-transparent p-0 text-left font-medium underline-offset-2 hover:underline ${
              row.correlationId === selectedId ? 'text-tint-accent' : 'text-tint-ink'
            }`}
          >
            /{commandLabel(row)}
          </button>
        ),
      },
      { id: 'actor', header: 'Invoked by' },
      { id: 'channel', header: 'Channel', renderCell: (row) => `#${row.channel}` },
      { id: 'agent', header: 'Agent', renderCell: (row) => row.agent ?? <span className="text-tint-muted">inline</span> },
      {
        id: 'status',
        header: 'Status',
        renderCell: (row) => <Badge tone={STATUS_TONES[row.status]}>{row.status}</Badge>,
      },
      { id: 'latencyMs', header: 'Latency', align: 'end', renderCell: (row) => formatMs(row.latencyMs) },
      { id: 'tick', header: 'When', align: 'end', renderCell: (row) => formatTickAge(row.tick) },
      {
        id: 'correlationId',
        header: 'Correlation',
        renderCell: (row) => <code className="text-xs text-tint-muted">{row.correlationId}</code>,
      },
    ],
    [onSelect, selectedId],
  )

  return (
    <DataTable
      rows={interactions}
      columns={columns}
      rowId="correlationId"
      density="compact"
      label="Slash command interactions"
      rowHeaderColumn="command"
      emptyState={<EmptyState title="No slash commands match" description="Widen the filters to see more traffic." />}
    />
  )
}

// -------------------------------------------------------------- correlations

function coefficientTone(coefficient: number): BadgeTone {
  if (coefficient >= 0.5) return 'danger'
  if (coefficient >= 0.2) return 'warning'
  if (coefficient <= -0.2) return 'success'
  return 'neutral'
}

/**
 * The ranked findings.
 *
 * The bar is drawn from the centre because sign carries meaning here: right of
 * centre is "travels with failure", left is "travels with success", and a
 * one-directional bar would make the second look like a weak version of the
 * first rather than the opposite of it.
 */
export function CorrelationFindings({
  findings,
  onRun,
  hasRun,
  sampleSize,
}: {
  findings: readonly CorrelationFinding[]
  onRun: () => void
  hasRun: boolean
  sampleSize: number
}) {
  return (
    <Card
      header="Correlations"
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs text-tint-muted">{sampleSize} settled interactions</span>
          <Button size="sm" variant="primary" onClick={onRun}>
            {hasRun ? 'Re-run' : 'Run correlations'}
          </Button>
        </div>
      }
    >
      {!hasRun ? (
        <EmptyState
          title="Not run yet"
          description="Measures which commands, agents and channels actually travel with failure — not just which appear most often."
        />
      ) : findings.length === 0 ? (
        <EmptyState
          title="Nothing stands out"
          description="No association passed the strength and sample-size floor. Widen the filters or wait for more traffic."
        />
      ) : (
        <ol className="m-0 grid list-none gap-3 p-0" aria-label="Correlation findings">
          {findings.map((finding) => {
            const magnitude = Math.min(1, Math.abs(finding.coefficient))
            const positive = finding.coefficient >= 0
            return (
              <li key={finding.id} className="grid gap-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">{finding.label}</span>
                  <Badge tone={coefficientTone(finding.coefficient)}>
                    {finding.coefficient >= 0 ? '+' : '−'}
                    {Math.abs(finding.coefficient).toFixed(2)}
                  </Badge>
                  <span className="ml-auto text-xs text-tint-muted">n={finding.sampleSize}</span>
                </div>
                <div className="flex h-1.5 w-full" aria-hidden="true">
                  <div className="flex flex-1 justify-end">
                    <div
                      className="h-full rounded-l bg-tint-success"
                      style={{ width: positive ? 0 : `${magnitude * 100}%` }}
                    />
                  </div>
                  <div className="w-px bg-tint-border" />
                  <div className="flex flex-1">
                    <div
                      className="h-full rounded-r bg-tint-danger"
                      style={{ width: positive ? `${magnitude * 100}%` : 0 }}
                    />
                  </div>
                </div>
                <p className="m-0 text-xs text-tint-muted">{finding.detail}</p>
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

export function CommandRollupTable({ interactions }: { interactions: readonly SlashInteraction[] }) {
  const rollups = useMemo(() => commandRollups(interactions), [interactions])
  const columns = useMemo(
    () => [
      { id: 'command', header: 'Command', renderCell: (row: (typeof rollups)[number]) => <code className="text-xs">/{row.command}</code> },
      { id: 'invocations', header: 'Calls', align: 'end' as const },
      { id: 'failures', header: 'Failed', align: 'end' as const },
      {
        id: 'failureRate',
        header: 'Failure rate',
        align: 'end' as const,
        renderCell: (row: (typeof rollups)[number]) => `${Math.round(row.failureRate * 100)}%`,
      },
      { id: 'p50Ms', header: 'p50', align: 'end' as const, renderCell: (row: (typeof rollups)[number]) => formatMs(row.p50Ms) },
      { id: 'p95Ms', header: 'p95', align: 'end' as const, renderCell: (row: (typeof rollups)[number]) => formatMs(row.p95Ms) },
      {
        id: 'agents',
        header: 'Handled by',
        renderCell: (row: (typeof rollups)[number]) => row.agents.join(', ') || <span className="text-tint-muted">inline</span>,
      },
    ],
    [],
  )

  return (
    <DataTable
      rows={rollups}
      columns={columns}
      rowId="command"
      density="compact"
      label="Command rollups"
      rowHeaderColumn="command"
      emptyState={<EmptyState title="No commands in range" />}
    />
  )
}

export function InteractionMetrics({ interactions }: { interactions: readonly SlashInteraction[] }) {
  const failed = interactions.filter((item) => item.status === 'failed').length
  const outstanding = interactions.filter((item) => item.status === 'pending' || item.status === 'deferred').length
  const agents = new Set(interactions.map((item) => item.agent).filter(Boolean)).size
  const slowest = interactions.reduce<SlashInteraction | null>(
    (worst, item) => (worst === null || item.latencyMs > worst.latencyMs ? item : worst),
    null,
  )

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <MetricCard label="Interactions" value={String(interactions.length)} hint={`${agents} agents`} tone="accent" />
      <MetricCard
        label="Failed"
        value={String(failed)}
        hint={interactions.length === 0 ? '—' : `${Math.round((failed / interactions.length) * 100)}% of traffic`}
        tone={failed > 0 ? 'danger' : 'default'}
      />
      <MetricCard label="In flight" value={String(outstanding)} hint={outstanding === 0 ? 'All settled' : 'Awaiting a follow-up'} />
      <MetricCard
        label="Slowest"
        value={slowest ? formatMs(slowest.latencyMs) : '—'}
        hint={slowest ? `/${commandLabel(slowest)}` : 'No traffic'}
      />
    </div>
  )
}

// ------------------------------------------------------------ guild activity

const MODERATION_TONES: Record<ModerationEvent['kind'], BadgeTone> = {
  'member.join': 'success',
  'member.leave': 'neutral',
  'message.delete': 'neutral',
  'message.flag': 'warning',
  'member.timeout': 'warning',
  'member.ban': 'danger',
  'role.grant': 'info',
  'agent.escalation': 'danger',
}

/**
 * Everything that happened in the guild, correlated or not.
 *
 * Rows that carry a correlation id are clickable through to the trace; ambient
 * ones are not, and say so by simply not offering the control.
 */
export function GuildActivityFeed({
  events,
  onSelect,
  selectedId,
}: {
  events: readonly ModerationEvent[]
  onSelect: (correlationId: string) => void
  selectedId: string | null
}) {
  if (events.length === 0) return <EmptyState title="Nothing has happened in range" />

  return (
    <ol className="m-0 grid list-none gap-2 p-0" aria-label="Guild activity events">
      {events.map((event) => (
        <li key={event.id}>
          <Surface
            className={`grid gap-1 p-3 ${event.correlationId && event.correlationId === selectedId ? 'border-tint-accent' : ''}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={MODERATION_TONES[event.kind]}>{event.kind}</Badge>
              {event.automated ? <Badge tone="info">automated</Badge> : null}
              <span className="text-sm">
                {event.actor}
                {event.subject ? ` → ${event.subject}` : ''}
              </span>
              <span className="ml-auto text-xs text-tint-muted">
                #{event.channel} · {formatTickAge(event.tick)}
              </span>
            </div>
            <p className="m-0 text-sm text-tint-muted">{event.detail}</p>
            {event.correlationId ? (
              <div>
                <Button size="sm" variant="ghost" onClick={() => onSelect(event.correlationId!)}>
                  Follow {event.correlationId}
                </Button>
              </div>
            ) : null}
          </Surface>
        </li>
      ))}
    </ol>
  )
}
