/**
 * The panel's own commands, as slash-command interactions.
 *
 * An operator pausing playback from this panel and someone typing `/pause` in
 * the guild are the same event to everyone downstream, and the feed is much
 * less useful if it only shows one of them. So every operation the panel
 * submits is projected into the same `SlashInteraction` shape as the recorded
 * traffic, under a correlation id the panel mints at submit time.
 *
 * It is a *projection*, not a second store: the operation seam remains the
 * only thing tracking state, and this derives from its snapshot. A parallel
 * list updated by hand would disagree with the operation log the moment a
 * command was cancelled.
 */
import { useCallback, useMemo, useRef, useState } from 'react'
import type { TintOperation } from '../../client'
import type { TelemetrySpan, TelemetryTrace } from '../../components/telemetry'
import type { InteractionStatus, SlashInteraction } from '../discord-panel'

export type LiveInteractionContext = {
  guildId: string
  channel: string
  actor: string
  options: Record<string, string | number | boolean>
}

function statusOf(operation: TintOperation): InteractionStatus {
  if (operation.state === 'queued') return 'pending'
  if (operation.state === 'running') return 'deferred'
  if (operation.state === 'succeeded') return 'replied'
  // `cancelled` has no interaction equivalent — Discord only knows the reply
  // never came — so it lands as a failure with the reason spelled out.
  return 'failed'
}

function errorOf(operation: TintOperation): string | null {
  if (operation.state === 'cancelled') return 'Cancelled before it was applied.'
  if (operation.state === 'failed') return operation.problem?.detail ?? operation.message ?? 'The command failed.'
  return null
}

/**
 * Three spans covering what the operation seam actually did: the panel
 * submitted, the host queued the job, the host applied it. Anything finer
 * would be invented — the fixture host does not report sub-steps.
 */
function traceFor(
  operation: TintOperation,
  correlationId: string,
  context: LiveInteractionContext,
  latencyMs: number,
): TelemetryTrace {
  const traceId = `trace-${correlationId}`
  const settled = operation.state !== 'queued' && operation.state !== 'running'
  const failed = operation.state === 'failed' || operation.state === 'cancelled'
  const submitMs = Math.min(20, Math.max(1, Math.round(latencyMs * 0.05)))

  const spans: TelemetrySpan[] = [
    {
      traceId,
      spanId: `${traceId}-s0`,
      name: 'panel.submit',
      service: 'discord-gateway',
      kind: 'server',
      status: 'ok',
      startMs: 0,
      endMs: latencyMs,
      attributes: { 'conversation.role': 'user', 'discord.correlation_id': correlationId },
      output: `/${operation.name.replace(':', ' ')} ${JSON.stringify(context.options)}`,
    },
    {
      traceId,
      spanId: `${traceId}-s1`,
      parentSpanId: `${traceId}-s0`,
      name: 'operations.enqueue',
      service: 'interaction-router',
      kind: 'internal',
      status: 'ok',
      startMs: submitMs,
      endMs: Math.max(submitMs, latencyMs - submitMs),
      attributes: { 'conversation.role': 'agent', 'operation.id': operation.id },
      output: operation.message ?? 'Queued the job on the bot host.',
    },
  ]

  if (settled) {
    spans.push({
      traceId,
      spanId: `${traceId}-s2`,
      parentSpanId: `${traceId}-s0`,
      name: 'host.apply',
      service: 'ludis-host',
      kind: 'client',
      status: failed ? 'error' : 'ok',
      startMs: Math.max(submitMs, latencyMs - submitMs),
      endMs: latencyMs,
      attributes: { 'conversation.role': 'tool' },
      output: errorOf(operation) ?? 'Applied to the guild player.',
    })
  }

  return { traceId, name: `/${operation.name.replace(':', ' ')}`, spans }
}

export type LiveInteractions = {
  interactions: readonly SlashInteraction[]
  traces: readonly TelemetryTrace[]
  /** Call at submit time with everything the operation snapshot cannot carry. */
  record: (operationId: string, context: LiveInteractionContext) => void
}

export function useLiveInteractions(operations: readonly TintOperation[]): LiveInteractions {
  const contexts = useRef(new Map<string, LiveInteractionContext>())
  // A counter rather than a state copy of the map: the map is keyed by an id
  // the caller already has, so only the "something was added" signal is state.
  const [, bump] = useState(0)

  const record = useCallback((operationId: string, context: LiveInteractionContext) => {
    contexts.current.set(operationId, context)
    bump((value) => value + 1)
  }, [])

  return useMemo(() => {
    const known = operations.filter((operation) => contexts.current.has(operation.id))
    if (known.length === 0) return { interactions: [], traces: [], record }

    const newest = Math.max(...known.map((operation) => Date.parse(operation.createdAt)))
    const interactions: SlashInteraction[] = []
    const traces: TelemetryTrace[] = []

    for (const operation of known) {
      const context = contexts.current.get(operation.id)!
      const created = Date.parse(operation.createdAt)
      const settledAt = operation.settledAt ? Date.parse(operation.settledAt) : null
      const latencyMs = Math.max(1, (settledAt ?? newest) - created)
      // Short enough to read in a card header and a status bar. The operation
      // id is a uuid; its first block already distinguishes a session's worth
      // of commands, and the full id stays on the span as `operation.id`.
      const correlationId = `live-${operation.id.slice(0, 8)}`
      const [command, subcommand = null] = operation.name.split(':')
      const trace = traceFor(operation, correlationId, context, latencyMs)
      traces.push(trace)
      interactions.push({
        id: operation.id,
        correlationId,
        guildId: context.guildId,
        channel: context.channel,
        actor: context.actor,
        command: command!,
        subcommand,
        options: context.options,
        tick: Math.round((created - newest) / 1000),
        status: statusOf(operation),
        latencyMs,
        agent: null,
        traceId: trace.traceId,
        operationName: operation.name,
        summary: errorOf(operation) ?? operation.message ?? 'Submitted from the control panel.',
        error: errorOf(operation),
      })
    }

    return { interactions, traces, record }
  }, [operations, record])
}
