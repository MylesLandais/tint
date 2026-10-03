/**
 * The ludis host, expressed as tint client capabilities.
 *
 * This file is the demo's reason for existing. ludis is a genuinely awkward
 * host — its reads are a poll, its writes are a job queue, and its player state
 * belongs to the server — and each of those lands on a different seam:
 *
 *   reads   → `RequestAdapter`      (the guild read model)
 *   writes  → `OperationAdapter`    (submit → queued → running → settled)
 *   player  → a host capability     (`capabilities.guildPlayer`)
 *   health  → `RealtimeAdapter`     (a poll that reports honestly)
 *
 * Everything is deterministic. There is no wall clock and no network; the
 * simulation advances only when `advance()` is called, which the panel drives
 * from an interval and a test drives by hand.
 */
import { createMemoryOperationAdapter } from '../../client/memoryOperations'
import type {
  ConnectionSnapshot,
  ConnectionState,
  OperationAdapter,
  RealtimeAdapter,
  RealtimeEvent,
  RealtimeSubscription,
  RequestAdapter,
  TintCapability,
} from '../../client/types'
import {
  createFixtureState,
  EPOCH_SECONDS,
  GUILDS,
  LIMITS,
  STATIONS,
  type AuditRow,
  type FixtureState,
  type Plugin,
  type PlayerSnapshot,
  type QueueEntry,
} from './fixtures'

export type GuildReadModel = {
  guildId: string
  plugins: readonly Plugin[]
  audit: readonly AuditRow[]
  stations: readonly { key: string; name: string; url: string }[]
}

/**
 * The commands the panel can submit, named the way ludis names them in its
 * audit log so the two line up on screen.
 */
export type PanelCommandName =
  | 'player:pause'
  | 'player:resume'
  | 'player:skip'
  | 'player:stop'
  | 'player:volume'
  | 'plugin:toggle'
  | 'play:query'
  | 'play:radio'

export type PanelCommandInput = {
  guildId: string
  /** `player:volume` */
  level?: number
  /** `plugin:toggle` */
  plugin?: string
  enabled?: boolean
  /** `play:query` */
  query?: string
  /** `play:radio` */
  station?: string
}

/** How the realtime poll behaves. The panel exposes this as a scenario switch. */
export type RealtimeScenario = 'healthy' | 'flaky' | 'offline'

/** Ticks a job spends running before it settles — ludis's jobs are not instant. */
const JOB_TICKS = 2

type PendingJob = {
  ticks: number
  resolve: () => void
  reject: (cause: unknown) => void
}

export type LudisHost = {
  request: RequestAdapter
  operations: OperationAdapter
  realtime: RealtimeAdapter
  /** Registered through `TintClientOptions.capabilities`. */
  guildPlayer: TintCapability<PlayerSnapshot> & { setGuild(guildId: string): void }
  /** Advances the simulation one step. Nothing here moves without it. */
  advance(): void
  setRealtimeScenario(scenario: RealtimeScenario): void
  getState(): FixtureState
  reset(): void
}

export function createLudisHost(initialGuildId: string = GUILDS[0]!.id): LudisHost {
  let state = createFixtureState()
  let guildId = initialGuildId
  let auditSeq = 0
  let scenario: RealtimeScenario = 'healthy'
  let pollTick = 0

  const pending: PendingJob[] = []
  const playerListeners = new Set<() => void>()
  const connectionListeners = new Set<() => void>()
  const channels = new Map<string, Set<(event: RealtimeEvent) => void>>()

  let connection: ConnectionSnapshot = { state: 'idle', attempt: 0 }

  function player(): PlayerSnapshot {
    return state.players[guildId]!
  }

  function publishPlayer(): void {
    for (const listener of playerListeners) listener()
  }

  function publishConnection(next: Partial<ConnectionSnapshot>): void {
    connection = { ...connection, ...next }
    for (const listener of connectionListeners) listener()
  }

  function emit(channel: string, type: string, data: unknown): void {
    const event: RealtimeEvent = {
      type,
      data,
      // Derived from the poll counter, not `Date.now()` — a fixture that
      // timestamps itself from the wall clock is not a fixture.
      receivedAt: new Date((EPOCH_SECONDS + pollTick) * 1000).toISOString(),
    }
    for (const listener of channels.get(channel) ?? []) listener(event)
  }

  function record(action: string): void {
    auditSeq += 1
    const rows = state.audit[guildId]!
    rows.unshift({ id: `live-${auditSeq}`, time: EPOCH_SECONDS + pollTick, actor: 'avery#4417', action })
    // ludis's panel shows the last 15 rows.
    state.audit[guildId] = rows.slice(0, 15)
  }

  // ---------------------------------------------------------------- requests

  const request: RequestAdapter = {
    async send<T>(input: { method: string; url: string }) {
      const match = /^\/guild\/([^/]+)$/.exec(input.url)
      if (input.method !== 'GET' || !match) {
        // ludis answers every mutation with 202 and a job id; the panel must go
        // through `operations` for those, so refusing here is the point.
        throw new Error(`The ludis fixture only serves GET /guild/{id}; got ${input.method} ${input.url}.`)
      }
      const id = match[1]!
      const model: GuildReadModel = {
        guildId: id,
        plugins: state.plugins[id] ?? [],
        audit: state.audit[id] ?? [],
        stations: STATIONS,
      }
      return { status: 200, headers: { 'content-type': 'application/json' }, data: model as T }
    },
  }

  // -------------------------------------------------------------- operations

  /**
   * Applies a command to the fixture state.
   *
   * Runs at settle time rather than submit time, so the panel genuinely has to
   * wait out the job rather than reading an optimistic local mutation — which
   * is what makes the disabled-button window real.
   */
  function apply(name: PanelCommandName, input: PanelCommandInput): void {
    const target = state.players[input.guildId]!
    switch (name) {
      case 'player:pause':
        target.paused = true
        record('player:pause')
        break
      case 'player:resume':
        target.paused = false
        target.notice = null
        record('player:resume')
        break
      case 'player:skip': {
        const [next, ...rest] = target.queue
        target.current = next ?? null
        target.queue = rest
        target.position = 0
        record('player:skip')
        break
      }
      case 'player:stop':
        target.current = null
        target.queue = []
        target.position = 0
        target.paused = false
        record('player:stop')
        break
      case 'player:volume':
        target.volume = Math.max(0, Math.min(100, Math.round(input.level ?? target.volume)))
        record(`player:volume:${target.volume}`)
        break
      case 'plugin:toggle': {
        const plugins = state.plugins[input.guildId]!
        const plugin = plugins.find((candidate) => candidate.name === input.plugin)
        if (plugin) {
          plugin.enabled = input.enabled ?? !plugin.enabled
          record(`plugin:${plugin.name}:${plugin.enabled}`)
        }
        break
      }
      case 'play:query': {
        if (target.queue.length >= LIMITS.queue) throw new Error('The queue is full.')
        const queued: QueueEntry = {
          id: `q-${auditSeq}-${target.queue.length}`,
          title: input.query ?? 'Unknown request',
          author: 'Preparing',
          source: 'youtube',
          length: 0,
          requester: 'avery#4417',
          state: 'queued',
        }
        target.queue = [...target.queue, queued]
        record('play:query')
        break
      }
      case 'play:radio': {
        const station = STATIONS.find((candidate) => candidate.key === input.station)
        if (!station) throw new Error('That station is not configured.')
        // The failing fixture: the panel needs one command that genuinely
        // fails, or its error path is decorative.
        if (station.key === 'nts1') throw new Error('NTS 1 did not respond within the deadline.')
        target.current = {
          id: `radio-${station.key}`,
          title: station.name,
          author: station.name,
          source: 'radio',
          length: 0,
          requester: 'avery#4417',
          state: 'ready',
        }
        target.paused = false
        record('play:radio')
        break
      }
    }
    target.busy = false
    publishPlayer()
  }

  const operations = createMemoryOperationAdapter({
    now: () => new Date((EPOCH_SECONDS + pollTick) * 1000),
    async run(command, context) {
      const name = command.name as PanelCommandName
      const input = (command.input ?? {}) as PanelCommandInput
      const target = state.players[input.guildId]
      if (target) {
        target.busy = true
        publishPlayer()
      }
      context.report('Waiting to apply your change…')

      await new Promise<void>((resolve, reject) => {
        const job: PendingJob = { ticks: JOB_TICKS, resolve, reject }
        pending.push(job)
        context.signal.addEventListener(
          'abort',
          () => {
            const index = pending.indexOf(job)
            if (index >= 0) pending.splice(index, 1)
            if (target) {
              target.busy = false
              publishPlayer()
            }
            reject(new Error('cancelled'))
          },
          { once: true },
        )
      })

      try {
        apply(name, input)
      } catch (cause) {
        if (target) {
          target.busy = false
          target.error = cause instanceof Error ? cause.message : 'The command failed.'
          publishPlayer()
        }
        throw cause
      }
      // Replace the "waiting" text before settling, so a finished row does not
      // sit there claiming it is still waiting.
      context.report('Applied.')
      emit(`guild:${input.guildId}`, 'guild.changed', { guildId: input.guildId })
      return { applied: name }
    },
  })

  // ---------------------------------------------------------------- realtime

  /**
   * A polling realtime adapter.
   *
   * ludis has no websocket — its panel polls `/state` every second. The
   * `ConnectionSnapshot` contract does not assume a socket, and this reports
   * what a poller actually knows: online while responses land, reconnecting
   * while they do not, offline once it gives up.
   */
  const realtime: RealtimeAdapter = {
    start() {
      publishConnection({ state: 'connecting', attempt: 0 })
    },
    stop() {
      publishConnection({ state: 'idle', attempt: 0, problem: undefined })
    },
    getSnapshot: () => connection,
    subscribe(listener) {
      connectionListeners.add(listener)
      return () => connectionListeners.delete(listener)
    },
    subscribeTo<T>(channel: string, listener: (event: RealtimeEvent<T>) => void): RealtimeSubscription {
      const set = channels.get(channel) ?? new Set()
      set.add(listener as (event: RealtimeEvent) => void)
      channels.set(channel, set)
      return { close: () => set.delete(listener as (event: RealtimeEvent) => void) }
    },
  }

  function pollConnection(): void {
    if (scenario === 'offline') {
      publishConnection({
        state: 'offline',
        attempt: connection.attempt + 1,
        problem: { code: 'transport_error', title: 'The bot is unreachable', detail: 'No response from the ludis panel.' },
      })
      return
    }
    // "Flaky" drops every fourth poll, so the panel has to render a
    // reconnecting state that resolves on its own.
    const dropped = scenario === 'flaky' && pollTick % 4 === 3
    const next: ConnectionState = dropped ? 'reconnecting' : 'online'
    publishConnection({
      state: next,
      attempt: dropped ? connection.attempt + 1 : 0,
      lastConnectedAt: dropped ? connection.lastConnectedAt : new Date((EPOCH_SECONDS + pollTick) * 1000).toISOString(),
      problem: undefined,
    })
  }

  // ------------------------------------------------------- player capability

  const guildPlayer: LudisHost['guildPlayer'] = {
    start() {
      publishPlayer()
    },
    getSnapshot: () => player(),
    subscribe(listener) {
      playerListeners.add(listener)
      return () => playerListeners.delete(listener)
    },
    setGuild(next) {
      guildId = next
      publishPlayer()
    },
  }

  return {
    request,
    operations,
    realtime,
    guildPlayer,
    advance() {
      pollTick += 1
      pollConnection()

      // Playback position only moves while the poll is actually landing.
      const current = player()
      if (connection.state === 'online' && current.current && !current.paused && current.current.length > 0) {
        current.position = (current.position + 1000) % current.current.length
        publishPlayer()
      }

      // Queue entries resolve from placeholder to ready, as ludis's resolver
      // fills them in behind the scenes.
      for (const target of Object.values(state.players)) {
        for (const item of target.queue) {
          if (item.state === 'queued') item.state = 'preparing'
          else if (item.state === 'preparing' || item.state === 'reading playlist') {
            item.state = 'ready'
            if (item.author === 'Preparing') item.author = 'Resolved upload'
            if (item.length === 0) item.length = 240_000
          }
        }
      }
      publishPlayer()

      for (const job of [...pending]) {
        job.ticks -= 1
        if (job.ticks > 0) continue
        pending.splice(pending.indexOf(job), 1)
        job.resolve()
      }
    },
    setRealtimeScenario(next) {
      scenario = next
      pollConnection()
    },
    getState: () => state,
    reset() {
      state = createFixtureState()
      auditSeq = 0
      pollTick = 0
      publishPlayer()
    },
  }
}
