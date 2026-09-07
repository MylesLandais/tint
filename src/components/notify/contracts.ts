/**
 * Notification read model over FeedDocument matches — never a second inventing store.
 *
 * `deriveFeedNotifications` is pure: the bell only shows rows the feed + settings can explain.
 */

import type { Identity } from '../identity'
import type { FeedDocument, PolicyDisposition } from '../feed/contracts'

export type NotificationKind = string
export type NotificationTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
export type NotificationAction = { id: string; label: string; href?: string; onSelect?: () => void; tone?: NotificationTone }

export type Notification = {
  id: string
  kind: NotificationKind
  title: string
  subtitle?: string
  createdAt: string
  read: boolean
  href?: string
  actor?: Identity
  actions?: readonly NotificationAction[]
  tone?: NotificationTone
  metadata?: Readonly<Record<string, unknown>>
}

/** Feed-policy projection fields stay on the feed-specific derivative. */
export type FeedNotification = Notification & {
  entryId?: string
  policyId?: string
  sourceId?: string
  disposition?: PolicyDisposition
}

export type NotifyChannel = 'off' | 'instant' | 'digest'

export type NotificationSettings = {
  /** Default when a source/policy has no override. */
  defaultChannel: NotifyChannel
  /** Per-source overrides keyed by source id. */
  bySource: Readonly<Record<string, NotifyChannel>>
  /** Per-policy overrides keyed by policy id. */
  byPolicy: Readonly<Record<string, NotifyChannel>>
  /** Quiet hours as `HH:mm` in local time; both null disables. */
  quietHours?: { start: string; end: string } | null
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  defaultChannel: 'instant',
  bySource: {},
  byPolicy: {},
  quietHours: null,
}

function channelFor(
  settings: NotificationSettings,
  sourceId: string | undefined,
  policyId: string | undefined,
): NotifyChannel {
  if (policyId && settings.byPolicy[policyId]) return settings.byPolicy[policyId]!
  if (sourceId && settings.bySource[sourceId]) return settings.bySource[sourceId]!
  return settings.defaultChannel
}

function parseHm(value: string): number {
  const [h, m] = value.split(':').map((part) => Number.parseInt(part, 10))
  return (h ?? 0) * 60 + (m ?? 0)
}

/** True when `at` falls inside quiet hours (supports wrap past midnight). */
export function isInQuietHours(
  at: Date,
  quiet: { start: string; end: string } | null | undefined,
): boolean {
  if (!quiet) return false
  const minutes = at.getHours() * 60 + at.getMinutes()
  const start = parseHm(quiet.start)
  const end = parseHm(quiet.end)
  if (start === end) return true
  if (start < end) return minutes >= start && minutes < end
  return minutes >= start || minutes < end
}

/**
 * Project feed matches (+ health / artifact cues) into notification rows.
 *
 * Instant channels produce one row per match. `off` drops them. `digest` is
 * still projected (hosts batch delivery); quiet hours only suppress `instant`.
 */
export function deriveFeedNotifications(
  document: FeedDocument,
  settings: NotificationSettings,
  options?: { now?: Date; readIds?: ReadonlySet<string> },
): readonly FeedNotification[] {
  const now = options?.now ?? new Date()
  const readIds = options?.readIds ?? new Set<string>()
  const byId = new Map(document.entries.map((entry) => [entry.id, entry]))
  const out: FeedNotification[] = []

  for (const match of document.matches) {
    const entry = byId.get(match.entryId)
    if (!entry) continue

    const channel = channelFor(settings, entry.sourceId, match.policyId)
    if (channel === 'off') continue

    const quiet =
      channel === 'instant' && isInQuietHours(new Date(match.matchedAt), settings.quietHours)
    if (quiet) continue

    const id = `match:${match.policyId}:${match.entryId}`
    out.push({
      id,
      entryId: match.entryId,
      policyId: match.policyId,
      sourceId: entry.sourceId,
      kind: 'match',
      title: entry.title,
      createdAt: match.matchedAt,
      read: readIds.has(id),
      href: `#/components/feed?entry=${encodeURIComponent(match.entryId)}&policy=${encodeURIComponent(match.policyId)}`,
      actions: [
        { id: 'open', label: 'Open entry', href: `#/components/feed?entry=${encodeURIComponent(match.entryId)}` },
        { id: 'why', label: 'Why', href: `#/components/policy?policy=${encodeURIComponent(match.policyId)}` },
      ],
      disposition: match.disposition,
    })
  }

  for (const entry of document.entries) {
    if (entry.artifactStatus !== 'ready') continue
    const channel = channelFor(settings, entry.sourceId, undefined)
    if (channel === 'off') continue
    const id = `artifact:${entry.id}`
    out.push({
      id,
      entryId: entry.id,
      sourceId: entry.sourceId,
      kind: 'artifact_ready',
      title: `Ready: ${entry.title}`,
      createdAt: entry.publishedAt,
      read: readIds.has(id),
      href: `#/components/feed?entry=${encodeURIComponent(entry.id)}`,
      actions: [{ id: 'open', label: 'Open entry', href: `#/components/feed?entry=${encodeURIComponent(entry.id)}` }],
    })
  }

  for (const source of document.sources) {
    if (source.health === 'healthy' || source.health === 'dormant') continue
    const channel = channelFor(settings, source.id, undefined)
    if (channel === 'off') continue
    const id = `health:${source.id}:${source.health}`
    out.push({
      id,
      sourceId: source.id,
      kind: 'source_health',
      title: `${source.handle} is ${source.health}`,
      createdAt: now.toISOString(),
      read: readIds.has(id),
      href: `#/components/feed?source=${encodeURIComponent(source.id)}`,
      tone: 'warning',
      actions: [{ id: 'open', label: 'Inspect source', href: `#/components/feed?source=${encodeURIComponent(source.id)}` }],
    })
  }

  return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
}
