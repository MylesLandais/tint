import { describe, expect, it } from 'vitest'
import {
  buildCorrelationIndex,
  bundleFor,
  commandLabel,
  commandRollups,
  conversationFromTrace,
  pearson,
  phiCoefficient,
  runCorrelations,
  MIN_COEFFICIENT,
} from './correlation'
import { createTraffic, generateTraffic, NEBULA_GUILD_ID, PANEL_GUILDS } from './fixtures'
import type { CorrelatedAuditRow, ModerationEvent, SlashInteraction } from './types'
import type { TelemetryTrace } from '../../components/telemetry'

const nebula = PANEL_GUILDS.find((guild) => guild.id === NEBULA_GUILD_ID)!

function interaction(overrides: Partial<SlashInteraction> & Pick<SlashInteraction, 'correlationId'>): SlashInteraction {
  return {
    id: `i-${overrides.correlationId}`,
    guildId: NEBULA_GUILD_ID,
    channel: 'general',
    actor: 'maya#4417',
    command: 'ask',
    subcommand: null,
    options: {},
    tick: 0,
    status: 'replied',
    latencyMs: 100,
    agent: 'maya-agent',
    traceId: null,
    operationName: null,
    summary: '',
    error: null,
    ...overrides,
  }
}

describe('buildCorrelationIndex', () => {
  it('joins an interaction, its trace, its audit row and its moderation event', () => {
    const trace: TelemetryTrace = {
      traceId: 't-1',
      name: '/ask',
      spans: [
        { traceId: 't-1', spanId: 's-1', name: 'interaction.receive', service: 'discord-gateway', kind: 'server', status: 'ok', startMs: 0, endMs: 10 },
      ],
    }
    const audit: CorrelatedAuditRow[] = [
      { id: 'a-1', correlationId: 'c-1', guildId: NEBULA_GUILD_ID, tick: -5, actor: 'maya#4417', action: 'ask:ok' },
    ]
    const moderation: ModerationEvent[] = [
      { id: 'm-1', correlationId: 'c-1', guildId: NEBULA_GUILD_ID, channel: 'general', kind: 'agent.escalation', actor: 'warden', subject: 'sam#7712', tick: -5, detail: 'escalated', automated: true },
    ]

    const bundles = buildCorrelationIndex({
      interactions: [interaction({ correlationId: 'c-1', traceId: 't-1' })],
      traces: [trace],
      moderation,
      audit,
    })

    expect(bundles).toHaveLength(1)
    const bundle = bundles[0]!
    expect(bundle.trace?.traceId).toBe('t-1')
    expect(bundle.audit).toHaveLength(1)
    expect(bundle.moderation).toHaveLength(1)
    expect(bundleFor(bundles, 'c-1')).toBe(bundle)
    expect(bundleFor(bundles, 'nope')).toBeNull()
  })

  it('drops ambient records that carry no correlation id', () => {
    const bundles = buildCorrelationIndex({
      interactions: [],
      traces: [],
      audit: [],
      moderation: [
        { id: 'm-amb', correlationId: null, guildId: NEBULA_GUILD_ID, channel: 'general', kind: 'member.join', actor: 'noor#5501', subject: null, tick: -3, detail: 'Joined.', automated: false },
      ],
    })
    expect(bundles).toEqual([])
  })

  it('keeps a bundle whose trace never arrived, rather than hiding the hole', () => {
    const bundles = buildCorrelationIndex({
      interactions: [interaction({ correlationId: 'c-2', traceId: 'missing' })],
      traces: [],
      moderation: [],
      audit: [],
    })
    expect(bundles[0]!.interaction).not.toBeNull()
    expect(bundles[0]!.trace).toBeNull()
  })

  it('orders bundles newest first', () => {
    const bundles = buildCorrelationIndex({
      interactions: [
        interaction({ correlationId: 'old', tick: -100 }),
        interaction({ correlationId: 'new', tick: -2 }),
      ],
      traces: [],
      moderation: [],
      audit: [],
    })
    expect(bundles.map((bundle) => bundle.correlationId)).toEqual(['new', 'old'])
  })
})

describe('conversationFromTrace', () => {
  it('reads the declared role and orders turns by start time', () => {
    const traffic = generateTraffic(nebula, 1, 8)
    const asked = traffic.interactions.find((item) => item.command === 'ask')!
    const trace = traffic.traces.find((item) => item.traceId === asked.traceId)!

    const turns = conversationFromTrace(trace)
    expect(turns.length).toBeGreaterThan(1)
    expect(turns[0]!.role).toBe('user')
    expect(turns.map((turn) => turn.startMs)).toEqual([...turns.map((turn) => turn.startMs)].sort((a, b) => a - b))
    expect(turns.some((turn) => turn.role === 'model')).toBe(true)
  })

  it('marks the failing turn', () => {
    const traffic = generateTraffic(nebula, 7, 40)
    const failed = traffic.interactions.find((item) => item.status === 'failed')!
    const trace = traffic.traces.find((item) => item.traceId === failed.traceId)!
    expect(conversationFromTrace(trace).filter((turn) => turn.failed)).toHaveLength(1)
  })

  it('returns nothing for a missing trace', () => {
    expect(conversationFromTrace(null)).toEqual([])
  })
})

describe('commandRollups', () => {
  it('labels subcommands and counts failures per command', () => {
    const rows = [
      interaction({ correlationId: 'a', command: 'mod', subcommand: 'ban', status: 'failed', latencyMs: 300 }),
      interaction({ correlationId: 'b', command: 'mod', subcommand: 'ban', latencyMs: 100 }),
      interaction({ correlationId: 'c', command: 'ping', latencyMs: 10 }),
    ]
    const rollups = commandRollups(rows)
    const ban = rollups.find((rollup) => rollup.command === 'mod ban')!
    expect(ban.invocations).toBe(2)
    expect(ban.failures).toBe(1)
    expect(ban.failureRate).toBe(0.5)
    expect(ban.p50Ms).toBe(200)
    // Sorted by volume, so the two-invocation command leads.
    expect(rollups[0]!.command).toBe('mod ban')
    expect(commandLabel(rows[2]!)).toBe('ping')
  })

  it('counts in-flight interactions as outstanding rather than as successes', () => {
    const rollups = commandRollups([
      interaction({ correlationId: 'a', status: 'deferred' }),
      interaction({ correlationId: 'b', status: 'pending' }),
      interaction({ correlationId: 'c', status: 'replied' }),
    ])
    expect(rollups[0]!.outstanding).toBe(2)
    expect(rollups[0]!.failures).toBe(0)
  })
})

describe('coefficients', () => {
  it('phi is +1 for a perfect association and -1 for a perfect inverse', () => {
    expect(phiCoefficient(5, 0, 0, 5)).toBe(1)
    expect(phiCoefficient(0, 5, 5, 0)).toBe(-1)
  })

  it('phi is 0 rather than NaN when a margin is empty', () => {
    expect(phiCoefficient(4, 0, 0, 0)).toBe(0)
    expect(phiCoefficient(0, 0, 0, 0)).toBe(0)
  })

  it('pearson tracks a linear relationship and ignores degenerate input', () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1)
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1)
    expect(pearson([1, 1, 1], [2, 5, 9])).toBe(0)
    expect(pearson([1], [1])).toBe(0)
  })
})

describe('runCorrelations', () => {
  it('surfaces the command that fails disproportionately', () => {
    const traffic = createTraffic()[NEBULA_GUILD_ID]!
    const findings = runCorrelations(buildCorrelationIndex(traffic))

    const ask = findings.find((finding) => finding.id === 'command:ask')
    expect(ask).toBeDefined()
    // `/ask` is the fixture's bad citizen; the coefficient must be positive.
    expect(ask!.coefficient).toBeGreaterThan(MIN_COEFFICIENT)
    // And it must outrank `/play`, which fails more often only by volume.
    const play = findings.find((finding) => finding.id === 'command:play')
    if (play) expect(Math.abs(ask!.coefficient)).toBeGreaterThan(Math.abs(play.coefficient))
  })

  it('ranks by absolute strength so a clean command is also reported', () => {
    const findings = runCorrelations(buildCorrelationIndex(createTraffic()[NEBULA_GUILD_ID]!))
    expect(findings).not.toHaveLength(0)
    const magnitudes = findings.map((finding) => Math.abs(finding.coefficient))
    expect(magnitudes).toEqual([...magnitudes].sort((left, right) => right - left))
    expect(magnitudes.every((value) => value >= MIN_COEFFICIENT)).toBe(true)
  })

  it('reports nothing when there is not enough settled traffic to judge', () => {
    const bundles = buildCorrelationIndex({
      interactions: [interaction({ correlationId: 'a' }), interaction({ correlationId: 'b', status: 'failed' })],
      traces: [],
      moderation: [],
      audit: [],
    })
    expect(runCorrelations(bundles)).toEqual([])
  })

  it('is deterministic across runs', () => {
    const first = runCorrelations(buildCorrelationIndex(createTraffic()[NEBULA_GUILD_ID]!))
    const second = runCorrelations(buildCorrelationIndex(createTraffic()[NEBULA_GUILD_ID]!))
    expect(first).toEqual(second)
  })
})
