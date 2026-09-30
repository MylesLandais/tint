/**
 * The domain shared by every Discord panel view.
 *
 * The bot panel and the mod panel are two readings of the same stream: a
 * slash command arrives, a router hands it to an agent, the agent talks to
 * tools and a model, and something observable happens in the guild. Each of
 * those is recorded separately by a different subsystem, and the only thing
 * that ties them together is the correlation id minted at the gateway.
 *
 * That id is the whole point of this module. Without it the interaction log,
 * the operation seam, the audit table and the trace store are four lists that
 * happen to be near each other in time; with it they are one story.
 */
import type { TelemetryTrace } from '../../core/telemetry'

/** Fixed epoch so every rendered timestamp is stable across runs. */
export const EPOCH_SECONDS = 1_788_000_000

/**
 * Where an interaction got to.
 *
 * `deferred` is Discord's own state — the bot acknowledged within the 3s
 * budget and owes a follow-up. It is not an error, but it is the state a
 * stuck agent gets wedged in, so it is worth its own colour.
 */
export type InteractionStatus = 'pending' | 'deferred' | 'replied' | 'failed'

export type InteractionOptionValue = string | number | boolean

/** One `/command` as the gateway received it. */
export type SlashInteraction = {
  id: string
  /** Minted at the gateway. The join key for every other record here. */
  correlationId: string
  guildId: string
  channel: string
  /** Discord tag of whoever typed it. */
  actor: string
  /** Bare command name, no leading slash: `play`, `ask`, `ban`. */
  command: string
  /** Subcommand, when the command has one: `/mod case close`. */
  subcommand: string | null
  options: Readonly<Record<string, InteractionOptionValue>>
  /** Tick the gateway saw it, against `EPOCH_SECONDS`. */
  tick: number
  status: InteractionStatus
  /** Gateway-to-final-reply wall time. */
  latencyMs: number
  /** Which agent picked it up, or null when it was handled inline. */
  agent: string | null
  /** Trace covering the agent's work, when one was recorded. */
  traceId: string | null
  /** The operation the panel would have submitted for the same effect. */
  operationName: string | null
  /** Model-visible one-liner, as the agent summarised its own turn. */
  summary: string
  /** Populated when `status` is `failed`. */
  error: string | null
}

/** Who said what, derived from a trace rather than stored twice. */
export type ConversationTurn = {
  spanId: string
  role: 'user' | 'agent' | 'tool' | 'model'
  /** Span name for tool/model turns, the actor's tag for a user turn. */
  label: string
  text: string
  startMs: number
  durationMs: number
  failed: boolean
}

/** Anything the mod panel needs to see happen in a guild. */
export type ModerationEventKind =
  | 'member.join'
  | 'member.leave'
  | 'message.delete'
  | 'message.flag'
  | 'member.timeout'
  | 'member.ban'
  | 'role.grant'
  | 'agent.escalation'

export type ModerationEvent = {
  id: string
  /** Present when the event came out of a slash command; null for ambient ones. */
  correlationId: string | null
  guildId: string
  channel: string
  kind: ModerationEventKind
  /** Who or what performed it — a moderator tag, or an agent name. */
  actor: string
  /** Who it happened to, when that is a different person. */
  subject: string | null
  tick: number
  detail: string
  /** Automated actions are the ones a human may want to review. */
  automated: boolean
}

/**
 * Everything recorded under one correlation id.
 *
 * Assembled by `buildCorrelationIndex`; every field except `correlationId` may
 * be missing, because the four subsystems fail independently and a bundle with
 * a hole in it is exactly what an operator needs to see.
 */
export type CorrelationBundle = {
  correlationId: string
  interaction: SlashInteraction | null
  trace: TelemetryTrace | null
  moderation: readonly ModerationEvent[]
  /** Audit rows the guild recorded under this id. */
  audit: readonly CorrelatedAuditRow[]
}

export type CorrelatedAuditRow = {
  id: string
  correlationId: string | null
  guildId: string
  tick: number
  actor: string
  action: string
}
