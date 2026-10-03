/**
 * Deterministic Discord traffic for both panels.
 *
 * Nothing here reads the clock or the network. Volume is generated from a
 * seeded PRNG and a per-command script, because the correlation statistics
 * need enough settled interactions to say anything — four hand-written rows
 * would make every coefficient an artefact of which rows got written.
 *
 * The scripts are hand-authored, though. Generated lorem in a conversation
 * trace would defeat the surface it is meant to demonstrate: the point of the
 * trace view is reading what the agent actually said.
 */
import type { TelemetrySpan, TelemetrySpanKind, TelemetryTrace } from '../../core/telemetry'
import { EPOCH_SECONDS, type ModerationEvent, type ModerationEventKind, type SlashInteraction } from './types'
import type { CorrelatedAuditRow } from './types'

export { EPOCH_SECONDS }

export type PanelGuild = {
  id: string
  name: string
  /** Voice channel the bot sits in, if any. */
  channel: string | null
  /** Text channels the mod panel watches. */
  channels: readonly string[]
}

export const NEBULA_GUILD_ID = '735512044'

export const PANEL_GUILDS: readonly PanelGuild[] = [
  { id: '184330891', name: 'Nebula Lounge', channel: 'the-pit', channels: ['general', 'requests'] },
  { id: '990244117', name: 'Late Shift', channel: 'radio-room', channels: ['general'] },
  { id: '473019556', name: 'Test Bench', channel: null, channels: ['general'] },
  { id: NEBULA_GUILD_ID, name: 'system-nebula', channel: 'ops-voice', channels: ['general', 'agent-lab', 'mod-log', 'incidents'] },
]

export const SIGNED_IN_USER = 'avery#4417'

/** The people that appear in the fixtures. Agents are named by their scripts. */
const HUMANS = ['avery#4417', 'river#0021', 'sam#7712', 'ilya#3390', 'noor#5501'] as const

/**
 * `mulberry32` — 32 bits of state, uniform enough for fixture shaping and
 * short enough to read. Seeded explicitly so a test and a browser see the
 * identical stream.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

function pick<T>(random: () => number, values: readonly T[]): T {
  return values[Math.floor(random() * values.length)]!
}

type TurnScript = {
  role: 'user' | 'agent' | 'tool' | 'model'
  name: string
  service: string
  kind: TelemetrySpanKind
  /** Nominal duration; jittered per interaction. */
  ms: number
  text: string
}

type CommandScript = {
  command: string
  subcommand: string | null
  /** Which agent picks it up, or null when the gateway answers inline. */
  agent: string | null
  operationName: string | null
  /** Roughly how often this command shows up, relative to its peers. */
  weight: number
  /** Chance a given invocation fails. */
  failureRate: number
  /** Index into `turns` that carries the error when one happens. */
  failureTurn: number
  summary: string
  failureMessage: string
  optionsFor: (random: () => number) => Record<string, string | number | boolean>
  turns: readonly TurnScript[]
}

const QUERIES = ['loscil slow corrosion', 'julianna barwick blue hour', 'nightride fm', 'boards of canada'] as const
const QUESTIONS = [
  'what did we decide about the resolver timeout?',
  'summarise the incident in #incidents',
  'who owns the lavalink deploy?',
  'is the archivist index stale?',
] as const

const SCRIPTS: readonly CommandScript[] = [
  {
    command: 'play',
    subcommand: null,
    agent: null,
    operationName: 'play:query',
    weight: 6,
    failureRate: 0.08,
    failureTurn: 2,
    summary: 'Queued the track.',
    failureMessage: 'The resolver did not answer within the deadline.',
    optionsFor: (random) => ({ query: pick(random, QUERIES) }),
    turns: [
      { role: 'user', name: 'interaction.receive', service: 'discord-gateway', kind: 'server', ms: 8, text: '/play query:…' },
      { role: 'agent', name: 'router.dispatch', service: 'interaction-router', kind: 'internal', ms: 14, text: 'Routing to the music plugin; no agent needed.' },
      { role: 'tool', name: 'resolver.search', service: 'track-resolver', kind: 'client', ms: 320, text: 'Resolved 1 track from youtube.' },
      { role: 'agent', name: 'interaction.reply', service: 'interaction-router', kind: 'internal', ms: 12, text: 'Added it to the queue.' },
    ],
  },
  {
    command: 'ask',
    subcommand: null,
    agent: 'avery-agent',
    operationName: null,
    weight: 5,
    // The interesting fixture: `/ask` fails far more than anything else, and
    // the correlation view is what makes that visible without counting rows.
    failureRate: 0.42,
    failureTurn: 3,
    summary: 'Answered from the guild archive.',
    failureMessage: 'The archive search timed out after 3 attempts.',
    optionsFor: (random) => ({ question: pick(random, QUESTIONS) }),
    turns: [
      { role: 'user', name: 'interaction.receive', service: 'discord-gateway', kind: 'server', ms: 9, text: '/ask question:…' },
      { role: 'agent', name: 'agent.plan', service: 'avery-agent', kind: 'internal', ms: 180, text: 'The answer is probably in the archive rather than in this channel. Searching there first.' },
      { role: 'model', name: 'llm.completion', service: 'llm-gateway', kind: 'client', ms: 640, text: 'Drafted a plan: search the archive, then quote the decision with its message link.' },
      { role: 'tool', name: 'archive.search', service: 'archivist', kind: 'client', ms: 910, text: 'Matched 3 messages in #incidents from the last 14 days.' },
      { role: 'model', name: 'llm.answer', service: 'llm-gateway', kind: 'client', ms: 720, text: 'We raised the resolver timeout to 8s and kept the retry budget at 3.' },
      { role: 'agent', name: 'interaction.reply', service: 'avery-agent', kind: 'internal', ms: 15, text: 'Posted the answer with a link to the original thread.' },
    ],
  },
  {
    command: 'summarize',
    subcommand: null,
    agent: 'archivist',
    operationName: null,
    weight: 3,
    failureRate: 0.1,
    failureTurn: 2,
    summary: 'Summarised the channel backlog.',
    failureMessage: 'Hit the 100-message read cap before reaching the requested window.',
    optionsFor: (random) => ({ channel: pick(random, ['incidents', 'agent-lab', 'general']), hours: 24 }),
    turns: [
      { role: 'user', name: 'interaction.receive', service: 'discord-gateway', kind: 'server', ms: 8, text: '/summarize channel:…' },
      { role: 'agent', name: 'agent.plan', service: 'archivist', kind: 'internal', ms: 90, text: 'Reading the channel window, then compressing per-thread.' },
      { role: 'tool', name: 'discord.read_history', service: 'discord-gateway', kind: 'client', ms: 540, text: 'Read 84 messages across 6 threads.' },
      { role: 'model', name: 'llm.summarize', service: 'llm-gateway', kind: 'client', ms: 880, text: 'Three threads: the resolver timeout, the Forgejo registry move, and a duplicate incident report.' },
      { role: 'agent', name: 'interaction.reply', service: 'archivist', kind: 'internal', ms: 11, text: 'Posted the summary as an embed.' },
    ],
  },
  {
    command: 'mod',
    subcommand: 'timeout',
    agent: 'warden',
    operationName: 'mod:timeout',
    weight: 2,
    failureRate: 0.12,
    failureTurn: 3,
    summary: 'Timed the member out and logged the case.',
    failureMessage: 'Missing Moderate Members on the target role.',
    optionsFor: (random) => ({ member: pick(random, HUMANS), minutes: pick(random, [10, 60, 240]), reason: 'spam' }),
    turns: [
      { role: 'user', name: 'interaction.receive', service: 'discord-gateway', kind: 'server', ms: 9, text: '/mod timeout member:…' },
      { role: 'agent', name: 'policy.evaluate', service: 'warden', kind: 'internal', ms: 120, text: 'Checked the actor is a moderator and the target is below them in the role hierarchy.' },
      { role: 'model', name: 'llm.classify', service: 'llm-gateway', kind: 'client', ms: 410, text: 'Classified the cited messages as spam with high confidence.' },
      { role: 'tool', name: 'discord.timeout_member', service: 'discord-gateway', kind: 'client', ms: 260, text: 'Applied a timeout and wrote case #1174.' },
      { role: 'agent', name: 'interaction.reply', service: 'warden', kind: 'internal', ms: 10, text: 'Confirmed the timeout in #mod-log.' },
    ],
  },
  {
    command: 'mod',
    subcommand: 'case',
    agent: 'warden',
    operationName: null,
    weight: 2,
    failureRate: 0.05,
    failureTurn: 2,
    summary: 'Returned the case file.',
    failureMessage: 'No case exists with that id.',
    optionsFor: (random) => ({ id: 1150 + Math.floor(random() * 40) }),
    turns: [
      { role: 'user', name: 'interaction.receive', service: 'discord-gateway', kind: 'server', ms: 7, text: '/mod case id:…' },
      { role: 'agent', name: 'case.load', service: 'warden', kind: 'internal', ms: 40, text: 'Loading the case and its linked messages.' },
      { role: 'tool', name: 'cases.read', service: 'case-store', kind: 'client', ms: 130, text: 'Case found: one timeout, two flagged messages, no appeal.' },
      { role: 'agent', name: 'interaction.reply', service: 'warden', kind: 'internal', ms: 9, text: 'Posted the case file, visible to moderators only.' },
    ],
  },
  {
    command: 'ping',
    subcommand: null,
    agent: null,
    operationName: null,
    weight: 2,
    // Never fails. That is deliberate: a strong *negative* correlation is as
    // useful as a positive one, and the panel should be able to show it.
    failureRate: 0,
    failureTurn: 0,
    summary: 'Answered with the gateway latency.',
    failureMessage: '',
    optionsFor: () => ({}),
    turns: [
      { role: 'user', name: 'interaction.receive', service: 'discord-gateway', kind: 'server', ms: 6, text: '/ping' },
      { role: 'agent', name: 'interaction.reply', service: 'interaction-router', kind: 'internal', ms: 8, text: 'Gateway round-trip 41ms.' },
    ],
  },
]

/** One entry per unit of weight, so `pick` respects the weights. */
const SCRIPT_POOL: readonly CommandScript[] = SCRIPTS.flatMap((script) =>
  Array.from({ length: script.weight }, () => script),
)

function traceFor(
  script: CommandScript,
  correlationId: string,
  random: () => number,
  fails: boolean,
): { trace: TelemetryTrace; latencyMs: number } {
  const traceId = `trace-${correlationId}`
  const spans: TelemetrySpan[] = []
  // The gateway span is the parent of everything the agent did, so the
  // waterfall nests instead of drawing one flat column.
  const rootSpanId = `${traceId}-s0`
  let cursor = 0

  const turns = fails ? script.turns.slice(0, script.failureTurn + 1) : script.turns
  turns.forEach((turn, index) => {
    // ±35% jitter, so latency has a spread for the correlations to work over.
    const duration = Math.max(1, Math.round(turn.ms * (0.65 + random() * 0.7)))
    const failedHere = fails && index === script.failureTurn
    spans.push({
      traceId,
      spanId: `${traceId}-s${index}`,
      parentSpanId: index === 0 ? undefined : rootSpanId,
      name: turn.name,
      service: turn.service,
      kind: turn.kind,
      status: failedHere ? 'error' : 'ok',
      startMs: cursor,
      endMs: cursor + duration,
      attributes: {
        'conversation.role': turn.role,
        'discord.correlation_id': correlationId,
        ...(failedHere ? { 'error.message': script.failureMessage } : {}),
      },
      output: failedHere ? script.failureMessage : turn.text,
    })
    cursor += duration
  })

  // The root span has to span its children, so widen it once they are placed.
  spans[0] = { ...spans[0]!, endMs: cursor }

  return {
    trace: { traceId, name: `/${script.subcommand ? `${script.command} ${script.subcommand}` : script.command}`, spans },
    latencyMs: cursor,
  }
}

export type GeneratedTraffic = {
  interactions: readonly SlashInteraction[]
  traces: readonly TelemetryTrace[]
  moderation: readonly ModerationEvent[]
  audit: readonly CorrelatedAuditRow[]
}

const AMBIENT_KINDS: readonly ModerationEventKind[] = ['member.join', 'member.leave', 'message.flag', 'message.delete']

/**
 * Builds a guild's traffic.
 *
 * `count` interactions are laid down backwards from tick 0, so the newest row
 * is always the one nearest the current tick regardless of how many there are.
 */
export function generateTraffic(guild: PanelGuild, seed: number, count: number): GeneratedTraffic {
  const random = createRandom(seed)
  const interactions: SlashInteraction[] = []
  const traces: TelemetryTrace[] = []
  const moderation: ModerationEvent[] = []
  const audit: CorrelatedAuditRow[] = []

  for (let index = 0; index < count; index += 1) {
    const script = pick(random, SCRIPT_POOL)
    const correlationId = `${guild.id.slice(0, 4)}-c${String(index + 1).padStart(3, '0')}`
    const fails = random() < script.failureRate
    const { trace, latencyMs } = traceFor(script, correlationId, random, fails)
    const actor = pick(random, HUMANS)
    const channel = pick(random, guild.channels)
    // Newest last in the loop, oldest tick first: index 0 is furthest back.
    const tick = -(count - index) * 7 - Math.floor(random() * 5)
    // Drawn once: the moderation event below has to name the same member the
    // interaction targeted, not a second roll of the dice.
    const options = script.optionsFor(random)

    traces.push(trace)
    interactions.push({
      id: `i-${correlationId}`,
      correlationId,
      guildId: guild.id,
      channel,
      actor,
      command: script.command,
      subcommand: script.subcommand,
      options,
      tick,
      status: fails ? 'failed' : 'replied',
      latencyMs,
      agent: script.agent,
      traceId: trace.traceId,
      operationName: script.operationName,
      summary: fails ? script.failureMessage : script.summary,
      error: fails ? script.failureMessage : null,
    })

    audit.push({
      id: `au-${correlationId}`,
      correlationId,
      guildId: guild.id,
      tick,
      actor,
      action: `${script.command}${script.subcommand ? `:${script.subcommand}` : ''}:${fails ? 'failed' : 'ok'}`,
    })

    if (script.subcommand === 'timeout' && !fails) {
      moderation.push({
        id: `m-${correlationId}`,
        correlationId,
        guildId: guild.id,
        channel,
        kind: 'member.timeout',
        actor: script.agent ?? actor,
        subject: String(options.member ?? actor),
        tick,
        detail: 'Timed out for spam; case filed.',
        automated: true,
      })
    }
    if (fails && script.agent) {
      moderation.push({
        id: `m-esc-${correlationId}`,
        correlationId,
        guildId: guild.id,
        channel,
        kind: 'agent.escalation',
        actor: script.agent,
        subject: actor,
        tick,
        detail: script.failureMessage,
        automated: true,
      })
    }
  }

  // Ambient guild activity, with no interaction behind it. These are the rows
  // that prove a correlation id is optional rather than assumed.
  for (let index = 0; index < Math.ceil(count / 2); index += 1) {
    const kind = pick(random, AMBIENT_KINDS)
    const subject = pick(random, HUMANS)
    moderation.push({
      id: `m-amb-${guild.id}-${index}`,
      correlationId: null,
      guildId: guild.id,
      channel: pick(random, guild.channels),
      kind,
      actor: kind === 'message.flag' ? 'warden' : subject,
      subject: kind === 'member.join' || kind === 'member.leave' ? null : subject,
      tick: -Math.floor(random() * count * 7),
      detail:
        kind === 'member.join'
          ? 'Joined the guild.'
          : kind === 'member.leave'
            ? 'Left the guild.'
            : kind === 'message.flag'
              ? 'Auto-flagged for review: repeated links.'
              : 'Message deleted by its author.',
      automated: kind === 'message.flag',
    })
  }

  return { interactions, traces, moderation, audit }
}

/** Fresh traffic for every guild, keyed by guild id. */
export function createTraffic(): Record<string, GeneratedTraffic> {
  const byGuild: Record<string, GeneratedTraffic> = {}
  PANEL_GUILDS.forEach((guild, index) => {
    // system-nebula is the guild the mod panel is for, so it gets the volume.
    const count = guild.id === NEBULA_GUILD_ID ? 40 : 16
    byGuild[guild.id] = generateTraffic(guild, 0x5eed + index * 977, count)
  })
  return byGuild
}

export function formatTickAge(tick: number): string {
  const seconds = Math.max(0, -tick)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  return `${Math.floor(seconds / 3600)}h ago`
}

export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
