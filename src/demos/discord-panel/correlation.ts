/**
 * Joining and correlating the four Discord record streams.
 *
 * Everything here is pure and synchronous. It takes already-recorded lists and
 * returns derived views, which is what makes the numbers on screen testable
 * without rendering anything or waiting for a tick.
 *
 * Two different things are called "correlation" in this file and they are not
 * the same operation:
 *
 *   `buildCorrelationIndex` is a *join* — group records by correlation id.
 *   `runCorrelations` is a *statistic* — measure which commands and agents
 *   actually travel with failure and latency, rather than eyeballing a log.
 *
 * The statistic matters because the log lies by volume: `/play` fails most
 * often in absolute terms simply because it is invoked most often. A phi
 * coefficient says whether it fails *disproportionately*, which is the
 * question an operator is actually asking.
 */
import type { TelemetrySpan, TelemetryTrace } from '../../components/telemetry'
import type {
  ConversationTurn,
  CorrelatedAuditRow,
  CorrelationBundle,
  ModerationEvent,
  SlashInteraction,
} from './types'

export type CorrelationSources = {
  interactions: readonly SlashInteraction[]
  traces: readonly TelemetryTrace[]
  moderation: readonly ModerationEvent[]
  audit: readonly CorrelatedAuditRow[]
}

/**
 * Groups every record under its correlation id.
 *
 * Records without an id are dropped rather than bucketed under a placeholder:
 * an ambient join event has no interaction to belong to, and inventing a
 * bundle for it would put an unrelated row in an operator's trace view.
 */
export function buildCorrelationIndex(sources: CorrelationSources): readonly CorrelationBundle[] {
  const tracesById = new Map(sources.traces.map((trace) => [trace.traceId, trace]))
  const bundles = new Map<string, {
    correlationId: string
    interaction: SlashInteraction | null
    trace: TelemetryTrace | null
    moderation: ModerationEvent[]
    audit: CorrelatedAuditRow[]
  }>()

  function bucket(correlationId: string) {
    let existing = bundles.get(correlationId)
    if (!existing) {
      existing = { correlationId, interaction: null, trace: null, moderation: [], audit: [] }
      bundles.set(correlationId, existing)
    }
    return existing
  }

  for (const interaction of sources.interactions) {
    const target = bucket(interaction.correlationId)
    target.interaction = interaction
    target.trace = interaction.traceId ? (tracesById.get(interaction.traceId) ?? null) : null
  }
  for (const event of sources.moderation) {
    if (event.correlationId) bucket(event.correlationId).moderation.push(event)
  }
  for (const row of sources.audit) {
    if (row.correlationId) bucket(row.correlationId).audit.push(row)
  }

  // Newest first, matching every other feed in the panel. Bundles with no
  // interaction sort last: they have no tick of their own to sort by.
  return [...bundles.values()]
    .map((entry) => ({
      correlationId: entry.correlationId,
      interaction: entry.interaction,
      trace: entry.trace,
      moderation: entry.moderation.slice().sort((left, right) => right.tick - left.tick),
      audit: entry.audit.slice().sort((left, right) => right.tick - left.tick),
    }))
    .sort((left, right) => (right.interaction?.tick ?? -1) - (left.interaction?.tick ?? -1))
}

/** The bundle a correlation id names, or null. */
export function bundleFor(
  bundles: readonly CorrelationBundle[],
  correlationId: string | null,
): CorrelationBundle | null {
  if (!correlationId) return null
  return bundles.find((bundle) => bundle.correlationId === correlationId) ?? null
}

// ------------------------------------------------------------- conversation

const ROLES = new Set(['user', 'agent', 'tool', 'model'])

/**
 * Infers a conversation role from the span's service when it does not declare
 * one. Hosts that emit `conversation.role` get exactly what they asked for.
 */
function roleOf(span: TelemetrySpan): ConversationTurn['role'] {
  const declared = span.attributes?.['conversation.role']
  if (typeof declared === 'string' && ROLES.has(declared)) return declared as ConversationTurn['role']
  if (span.service.includes('gateway') || span.service.includes('discord')) return 'user'
  if (span.service.includes('llm') || span.service.includes('model')) return 'model'
  if (span.kind === 'client') return 'tool'
  return 'agent'
}

/** Renders whatever the span captured as something a person can read. */
function textOf(span: TelemetrySpan): string {
  const payload = span.output ?? span.input
  if (typeof payload === 'string') return payload
  if (payload == null) return ''
  return JSON.stringify(payload)
}

/**
 * The agent's conversation, derived from the trace rather than stored beside it.
 *
 * Deriving it is the point: a separate transcript list would be a second copy
 * that drifts, and the thing an operator wants to know — which turn was slow,
 * which turn failed — only exists on the span.
 */
export function conversationFromTrace(trace: TelemetryTrace | null): readonly ConversationTurn[] {
  if (!trace) return []
  return trace.spans
    .filter((span) => textOf(span) !== '')
    .slice()
    .sort((left, right) => left.startMs - right.startMs)
    .map((span) => ({
      spanId: span.spanId,
      role: roleOf(span),
      label: span.name,
      text: textOf(span),
      startMs: span.startMs,
      durationMs: Math.max(0, span.endMs - span.startMs),
      failed: span.status === 'error',
    }))
}

// ----------------------------------------------------------------- rollups

export type CommandRollup = {
  /** `play`, or `mod ban` for a subcommand. */
  command: string
  invocations: number
  failures: number
  /** Interactions still `pending` or `deferred` at the current tick. */
  outstanding: number
  failureRate: number
  p50Ms: number
  p95Ms: number
  /** Agents that handled this command, in first-seen order. */
  agents: readonly string[]
}

/** `/mod ban` reads better than `mod` when a command has subcommands. */
export function commandLabel(interaction: SlashInteraction): string {
  return interaction.subcommand ? `${interaction.command} ${interaction.subcommand}` : interaction.command
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = (sorted.length - 1) * p
  const low = Math.floor(index)
  const high = Math.ceil(index)
  if (low === high) return sorted[low]!
  return sorted[low]! + (sorted[high]! - sorted[low]!) * (index - low)
}

/** Per-command counts and latency spread, sorted by volume. */
export function commandRollups(interactions: readonly SlashInteraction[]): readonly CommandRollup[] {
  const groups = new Map<string, SlashInteraction[]>()
  for (const interaction of interactions) {
    const key = commandLabel(interaction)
    const list = groups.get(key)
    if (list) list.push(interaction)
    else groups.set(key, [interaction])
  }

  return [...groups.entries()]
    .map(([command, list]) => {
      const failures = list.filter((item) => item.status === 'failed').length
      const latencies = list.map((item) => item.latencyMs).sort((left, right) => left - right)
      const agents: string[] = []
      for (const item of list) {
        if (item.agent && !agents.includes(item.agent)) agents.push(item.agent)
      }
      return {
        command,
        invocations: list.length,
        failures,
        outstanding: list.filter((item) => item.status === 'pending' || item.status === 'deferred').length,
        failureRate: list.length === 0 ? 0 : failures / list.length,
        p50Ms: percentile(latencies, 0.5),
        p95Ms: percentile(latencies, 0.95),
        agents,
      }
    })
    .sort((left, right) => right.invocations - left.invocations || left.command.localeCompare(right.command))
}

// ------------------------------------------------------------- correlations

/**
 * Phi coefficient for a 2x2 table — the correlation between two yes/no facts.
 *
 * Returns 0 when any margin is empty. That is the honest answer: if every
 * interaction failed, "being a `/play`" explains none of it, and a divide-by-
 * zero NaN leaking into a sorted list would rank noise at the top.
 */
export function phiCoefficient(bothTrue: number, aOnly: number, bOnly: number, neither: number): number {
  const rowA = bothTrue + aOnly
  const rowB = bOnly + neither
  const colA = bothTrue + bOnly
  const colB = aOnly + neither
  const denominator = Math.sqrt(rowA * rowB * colA * colB)
  if (denominator === 0) return 0
  return (bothTrue * neither - aOnly * bOnly) / denominator
}

/**
 * Pearson's r over paired samples. Returns 0 for a degenerate series, for the
 * same reason `phiCoefficient` does.
 */
export function pearson(xs: readonly number[], ys: readonly number[]): number {
  const n = Math.min(xs.length, ys.length)
  if (n < 2) return 0
  let sumX = 0
  let sumY = 0
  for (let i = 0; i < n; i += 1) {
    sumX += xs[i]!
    sumY += ys[i]!
  }
  const meanX = sumX / n
  const meanY = sumY / n
  let covariance = 0
  let varianceX = 0
  let varianceY = 0
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i]! - meanX
    const dy = ys[i]! - meanY
    covariance += dx * dy
    varianceX += dx * dx
    varianceY += dy * dy
  }
  const denominator = Math.sqrt(varianceX * varianceY)
  if (denominator === 0) return 0
  return covariance / denominator
}

export type CorrelationFinding = {
  id: string
  /** Which question the coefficient answers. */
  kind: 'command-failure' | 'agent-failure' | 'latency-shape' | 'channel-failure'
  label: string
  /** Phi or Pearson, both in [-1, 1]. */
  coefficient: number
  /** Pairs the coefficient was computed over. */
  sampleSize: number
  detail: string
}

/**
 * Interactions a correlation may be computed over.
 *
 * Anything still in flight is excluded: a `pending` row is not yet a success
 * or a failure, and counting it as "not failed" would drag every coefficient
 * toward zero as traffic arrives.
 */
function settled(interactions: readonly SlashInteraction[]): readonly SlashInteraction[] {
  return interactions.filter((item) => item.status === 'replied' || item.status === 'failed')
}

/** Below this there is not enough evidence to rank anything honestly. */
export const MIN_SAMPLE = 4

/** Coefficients weaker than this are indistinguishable from noise here. */
export const MIN_COEFFICIENT = 0.2

function association(
  rows: readonly SlashInteraction[],
  isA: (interaction: SlashInteraction) => boolean,
): { coefficient: number; bothTrue: number; total: number } {
  let bothTrue = 0
  let aOnly = 0
  let bOnly = 0
  let neither = 0
  for (const row of rows) {
    const a = isA(row)
    const failed = row.status === 'failed'
    if (a && failed) bothTrue += 1
    else if (a) aOnly += 1
    else if (failed) bOnly += 1
    else neither += 1
  }
  return { coefficient: phiCoefficient(bothTrue, aOnly, bOnly, neither), bothTrue, total: rows.length }
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

/**
 * Ranks what actually travels with failure and latency.
 *
 * Findings are sorted by absolute coefficient, so a strongly *negative* result
 * ("`/ping` never fails") ranks alongside a positive one. Both are useful:
 * one narrows the search, the other rules a suspect out.
 */
export function runCorrelations(bundles: readonly CorrelationBundle[]): readonly CorrelationFinding[] {
  const interactions = bundles
    .map((bundle) => bundle.interaction)
    .filter((interaction): interaction is SlashInteraction => interaction !== null)
  const rows = settled(interactions)
  const findings: CorrelationFinding[] = []

  if (rows.length >= MIN_SAMPLE) {
    const commands = [...new Set(rows.map(commandLabel))]
    for (const command of commands) {
      const { coefficient, bothTrue } = association(rows, (row) => commandLabel(row) === command)
      const invocations = rows.filter((row) => commandLabel(row) === command).length
      findings.push({
        id: `command:${command}`,
        kind: 'command-failure',
        label: `/${command} ↔ failure`,
        coefficient,
        sampleSize: rows.length,
        detail: `${bothTrue}/${invocations} invocations failed (${percent(invocations === 0 ? 0 : bothTrue / invocations)}).`,
      })
    }

    const agents = [...new Set(rows.map((row) => row.agent).filter((agent): agent is string => agent !== null))]
    for (const agent of agents) {
      const { coefficient, bothTrue } = association(rows, (row) => row.agent === agent)
      const handled = rows.filter((row) => row.agent === agent).length
      findings.push({
        id: `agent:${agent}`,
        kind: 'agent-failure',
        label: `${agent} ↔ failure`,
        coefficient,
        sampleSize: rows.length,
        detail: `${bothTrue}/${handled} handled interactions failed.`,
      })
    }

    const channels = [...new Set(rows.map((row) => row.channel))]
    if (channels.length > 1) {
      for (const channel of channels) {
        const { coefficient, bothTrue } = association(rows, (row) => row.channel === channel)
        const seen = rows.filter((row) => row.channel === channel).length
        findings.push({
          id: `channel:${channel}`,
          kind: 'channel-failure',
          label: `#${channel} ↔ failure`,
          coefficient,
          sampleSize: rows.length,
          detail: `${bothTrue}/${seen} interactions in this channel failed.`,
        })
      }
    }
  }

  // Latency against trace shape, over the bundles that actually carry a trace.
  const traced = bundles.filter(
    (bundle): bundle is CorrelationBundle & { interaction: SlashInteraction; trace: TelemetryTrace } =>
      bundle.interaction !== null && bundle.trace !== null,
  )
  if (traced.length >= MIN_SAMPLE) {
    const latencies = traced.map((bundle) => bundle.interaction.latencyMs)
    const spanCounts = traced.map((bundle) => bundle.trace.spans.length)
    const toolCounts = traced.map(
      (bundle) => bundle.trace.spans.filter((span) => roleOf(span) === 'tool').length,
    )
    findings.push({
      id: 'latency:spans',
      kind: 'latency-shape',
      label: 'latency ↔ span count',
      coefficient: pearson(latencies, spanCounts),
      sampleSize: traced.length,
      detail: 'How much of the wall time is explained by how much the agent did.',
    })
    findings.push({
      id: 'latency:tools',
      kind: 'latency-shape',
      label: 'latency ↔ tool calls',
      coefficient: pearson(latencies, toolCounts),
      sampleSize: traced.length,
      detail: 'Whether slow turns are slow because of tool round-trips.',
    })
  }

  return findings
    .filter((finding) => Math.abs(finding.coefficient) >= MIN_COEFFICIENT)
    .sort((left, right) => Math.abs(right.coefficient) - Math.abs(left.coefficient))
}
