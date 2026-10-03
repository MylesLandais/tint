/**
 * Deterministic fixtures for the Discord bot panel.
 *
 * Ported from lain's `ludis` prototype — a Lua Discord music bot serving many
 * guilds through Lavalink and a private resolver. The terminology and the
 * shapes are ludis's; none of the Lua is. Anywhere ludis returned a rendered
 * HTML fragment, this is the read model that fragment was built from.
 *
 * Nothing here reads the clock or the network. The panel advances by an
 * explicit tick so a test can drive it and get the same answer every time.
 */

import { NEBULA_GUILD_ID, PANEL_GUILDS } from '../discord-panel/fixtures'

export type Guild = {
  id: string
  name: string
  /** Voice channel the bot is sitting in, if any. */
  channel: string | null
}

/** `state` mirrors ludis's placeholder-to-resolved queue entry progression. */
export type QueueEntryState = 'queued' | 'preparing' | 'reading playlist' | 'ready'

export type QueueEntry = {
  id: string
  title: string
  author: string
  /** Lavalink's `sourceName`: youtube, soundcloud, radio, … */
  source: string
  /** Milliseconds, as Lavalink reports it. */
  length: number
  requester: string
  state: QueueEntryState
}

/**
 * The player read model, matching ludis's `music.lua:snapshot`.
 *
 * This is *server*-owned, which is why it is registered as a host capability
 * rather than dropped into the built-in `playback` adapter: that one is a
 * browser queue backed by localStorage, and pretending this is the same thing
 * would put a guild's state in a viewer's browser.
 */
export type PlayerSnapshot = {
  current: QueueEntry | null
  queue: readonly QueueEntry[]
  volume: number
  paused: boolean
  channel: string | null
  /** Milliseconds into `current`. */
  position: number
  error: string | null
  notice: string | null
  busy: boolean
  connected: boolean
  queueLimit: number
}

export type Plugin = {
  name: string
  description: string
  /** Space-separated command names, as ludis's panel rendered them. */
  commands: string
  enabled: boolean
}

/** ludis's audit rows: `plugin:music:true`, `player:pause`, … */
export type AuditRow = {
  id: string
  /** Seconds since the epoch, as SQLite stored it. */
  time: number
  actor: string
  action: string
}

export type Station = { key: string; name: string; url: string }

/** ludis's `limits.lua`. Only the queue cap matters to the panel. */
export const LIMITS = { queue: 200 } as const

export const SIGNED_IN_USER = 'avery#4417'

/** Fixed epoch so every rendered timestamp is stable across runs. */
export const EPOCH_SECONDS = 1_788_000_000

/**
 * Derived from the shared guild list rather than re-declared.
 *
 * The mod panel and this panel disagreeing about which guilds exist was the
 * kind of drift that only shows up as an empty screen, so there is one list.
 */
export const GUILDS: readonly Guild[] = PANEL_GUILDS.map((guild) => ({
  id: guild.id,
  name: guild.name,
  channel: guild.channel,
}))

export const STATIONS: readonly Station[] = [
  { key: 'nightride', name: 'Harbor FM', url: 'https://stream.nightride.fm/nightride.m4a' },
  { key: 'somafm-groove', name: 'SomaFM · Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-mp3' },
  { key: 'nts1', name: 'NTS 1', url: 'https://stream-relay-geo.ntslive.net/stream' },
]

function entry(
  id: string,
  title: string,
  author: string,
  source: string,
  minutes: number,
  requester: string,
  state: QueueEntryState = 'ready',
): QueueEntry {
  return { id, title, author, source, length: Math.round(minutes * 60_000), requester, state }
}

const PLAYERS: Record<string, PlayerSnapshot> = {
  '184330891': {
    current: entry('t-1', 'Midnight Cassette', 'Kenji Arai', 'youtube', 6.5, 'avery#4417'),
    queue: [
      entry('t-2', 'Slow Corrosion', 'Tidal Array', 'youtube', 8.2, 'river#0021'),
      entry('t-3', 'Blue Hour', 'Mira Stone', 'soundcloud', 4.9, 'avery#4417'),
      entry('t-4', 'Untitled Import', 'Preparing', 'youtube_playlist', 0, 'sam#7712', 'reading playlist'),
    ],
    volume: 70,
    paused: false,
    channel: 'the-pit',
    position: 92_000,
    error: null,
    notice: null,
    busy: false,
    connected: true,
    queueLimit: LIMITS.queue,
  },
  '990244117': {
    current: entry('r-1', 'Harbor FM', 'Harbor FM', 'radio', 0, 'river#0021'),
    queue: [],
    volume: 45,
    paused: true,
    channel: 'radio-room',
    position: 0,
    error: null,
    notice: 'Paused by an administrator 12 minutes ago.',
    busy: false,
    connected: true,
    queueLimit: LIMITS.queue,
  },
  [NEBULA_GUILD_ID]: {
    current: entry('n-1', 'Ops Standup Loop', 'system-nebula', 'radio', 0, 'avery#4417'),
    queue: [entry('n-2', 'Deploy Window Chime', 'system-nebula', 'soundcloud', 1.2, 'warden')],
    volume: 30,
    paused: false,
    channel: 'ops-voice',
    position: 0,
    error: null,
    notice: null,
    busy: false,
    connected: true,
    queueLimit: LIMITS.queue,
  },
  '473019556': {
    current: null,
    queue: [],
    volume: 70,
    paused: false,
    channel: null,
    position: 0,
    error: null,
    notice: null,
    busy: false,
    connected: false,
    queueLimit: LIMITS.queue,
  },
}

const PLUGINS: Record<string, readonly Plugin[]> = {
  '184330891': [
    { name: 'music', description: 'Queue, radio, and transport controls.', commands: 'play playlist radio queue volume pause resume skip stop', enabled: true },
    { name: 'ping', description: 'Liveness check.', commands: 'ping', enabled: true },
  ],
  '990244117': [
    { name: 'music', description: 'Queue, radio, and transport controls.', commands: 'play playlist radio queue volume pause resume skip stop', enabled: true },
    { name: 'ping', description: 'Liveness check.', commands: 'ping', enabled: false },
  ],
  [NEBULA_GUILD_ID]: [
    { name: 'music', description: 'Queue, radio, and transport controls.', commands: 'play playlist radio queue volume pause resume skip stop', enabled: true },
    { name: 'ping', description: 'Liveness check.', commands: 'ping', enabled: true },
    { name: 'agents', description: 'Routes slash commands to avery, the archivist and the warden.', commands: 'ask summarize', enabled: true },
    { name: 'moderation', description: 'Warden policy checks, timeouts and case files.', commands: 'mod', enabled: true },
  ],
  '473019556': [
    { name: 'music', description: 'Queue, radio, and transport controls.', commands: 'play playlist radio queue volume pause resume skip stop', enabled: false },
    { name: 'ping', description: 'Liveness check.', commands: 'ping', enabled: true },
  ],
}

const AUDIT: Record<string, readonly AuditRow[]> = {
  '184330891': [
    { id: 'a-1', time: EPOCH_SECONDS - 40, actor: 'avery#4417', action: 'player:resume' },
    { id: 'a-2', time: EPOCH_SECONDS - 320, actor: 'river#0021', action: 'play:query' },
    { id: 'a-3', time: EPOCH_SECONDS - 900, actor: 'avery#4417', action: 'plugin:ping:true' },
  ],
  '990244117': [
    { id: 'a-4', time: EPOCH_SECONDS - 720, actor: 'river#0021', action: 'player:pause' },
    { id: 'a-5', time: EPOCH_SECONDS - 1_100, actor: 'river#0021', action: 'plugin:ping:false' },
  ],
  [NEBULA_GUILD_ID]: [
    { id: 'a-7', time: EPOCH_SECONDS - 120, actor: 'warden', action: 'plugin:moderation:true' },
    { id: 'a-8', time: EPOCH_SECONDS - 640, actor: 'avery#4417', action: 'plugin:agents:true' },
  ],
  '473019556': [{ id: 'a-6', time: EPOCH_SECONDS - 86_400, actor: 'sam#7712', action: 'plugin:music:false' }],
}

/** Fresh deep copies, so a panel instance never mutates the fixtures. */
export function createFixtureState() {
  return {
    players: structuredClone(PLAYERS) as Record<string, PlayerSnapshot>,
    plugins: structuredClone(PLUGINS) as Record<string, Plugin[]>,
    audit: structuredClone(AUDIT) as Record<string, AuditRow[]>,
  }
}

export type FixtureState = ReturnType<typeof createFixtureState>

export function formatDuration(milliseconds: number): string {
  if (milliseconds <= 0) return 'live'
  const total = Math.round(milliseconds / 1000)
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

/** Relative time against the fixed epoch, so output never drifts. */
export function formatAge(seconds: number): string {
  const delta = Math.max(0, EPOCH_SECONDS - seconds)
  if (delta < 60) return `${delta}s ago`
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`
  if (delta < 86_400) return `${Math.floor(delta / 3600)}h ago`
  return `${Math.floor(delta / 86_400)}d ago`
}
