/**
 * Host-owned feed document — GraphDocument-shaped, React-free.
 *
 * Tint presents this; Kino (or a docs demo store) owns mutation and crawl. The
 * collections are `readonly` and replaced wholesale so `revision` stays honest.
 *
 * Mock-only in tint: fixtures stand in while the server is developed separately.
 */

export type FeedId = string
export type RevisionToken = string

export type SourcePlatform =
  | 'youtube'
  | 'rss'
  | 'web'
  | 'forum'
  | 'tiktok'
  | 'instagram'
  | 'reddit'
  | 'other'

export type SourceHealth = 'healthy' | 'unreachable' | 'inactive' | 'dormant'

/**
 * Routeable room / topic — one place in the product where inbound streams land
 * and (later) agents/users interact. Docs demos use paths like `channel/${slug}`.
 *
 * Not a YouTube/TikTok API object. Activity's `ForumChannel` shares the same
 * `{ id, name, slug }` convention for rooms that also host forum threads; the
 * types stay separate (FeedDocument vs ActivityDocument) until a later unify.
 */
export type Channel = {
  id: string
  /** URL segment: misskatie | LTT | gaming | nsfw */
  slug: string
  /** Display title in nav / header. */
  name: string
  /** Optional short topic blurb. */
  description?: string
  avatarUrl?: string
}

/**
 * One inbound stream into a channel: platform endpoint + workflow + health.
 * UI copy may say "stream"; the code name stays Source (already shipped).
 */
export type Source = {
  id: string
  /** Channel this stream feeds. */
  channelId: string
  /** Display handle or site label on that platform. */
  handle: string
  url: string
  platform: SourcePlatform
  /** Bound crawl/workflow name (e.g. `youtube-poll`, `k2s-unlock`). */
  workflowName: string
  health: SourceHealth
  unreadCount: number
  /**
   * Opaque credential handle. Never the secret itself — demos that "store" a
   * token return a ref like `cred_demo_1` so conversation history stays clean.
   */
  credentialRef?: string
}

export type ReadState = 'unread' | 'read' | 'archived'

export type ContentKind = 'article' | 'video' | 'release' | 'thread' | 'other'

export type ArtifactStatus = 'none' | 'queued' | 'downloading' | 'ready'

export type FeedEntry = {
  id: string
  sourceId: string
  title: string
  url: string
  publishedAt: string
  excerpt: string
  media?: { kind: 'image' | 'video'; url: string; width?: number; height?: number }
  tags: readonly string[]
  readState: ReadState
  contentKind: ContentKind
  artifactStatus?: ArtifactStatus
  /** Optional long-form body for the reader pane (HTML-safe plain text in demos). */
  body?: string
}

export type PolicyDisposition = 'auto_queue' | 'notify_only' | 'notify_and_cache'

export type PolicyMatch = {
  entryId: string
  policyId: string
  disposition: PolicyDisposition
  matchedAt: string
}

export type FeedDocument = {
  schemaVersion: string
  id: FeedId
  revision: RevisionToken
  channels: readonly Channel[]
  sources: readonly Source[]
  entries: readonly FeedEntry[]
  matches: readonly PolicyMatch[]
  metadata: Record<string, unknown>
}

export function nextFeedRevision(current: RevisionToken): RevisionToken {
  const n = Number.parseInt(current.replace(/\D/g, ''), 10)
  return `r${Number.isFinite(n) ? n + 1 : 1}`
}

/** Docs / host route for a channel room. */
export function channelPath(channel: Pick<Channel, 'slug'>): string {
  return `channel/${channel.slug}`
}

export function sourcesForChannel(
  document: Pick<FeedDocument, 'sources'>,
  channelId: string,
): readonly Source[] {
  return document.sources.filter((source) => source.channelId === channelId)
}

export function channelForSource(
  document: Pick<FeedDocument, 'channels' | 'sources'>,
  sourceId: string,
): Channel | undefined {
  const source = document.sources.find((item) => item.id === sourceId)
  if (!source) return undefined
  return document.channels.find((channel) => channel.id === source.channelId)
}

export function entriesForChannel(
  document: Pick<FeedDocument, 'sources' | 'entries'>,
  channelId: string,
): readonly FeedEntry[] {
  const sourceIds = new Set(
    document.sources.filter((source) => source.channelId === channelId).map((source) => source.id),
  )
  return document.entries.filter((entry) => sourceIds.has(entry.sourceId))
}

/** Attribution line: `MissKatie · youtube`. */
export function resolveAttribution(
  document: Pick<FeedDocument, 'channels' | 'sources'>,
  sourceId: string,
): string {
  const source = document.sources.find((item) => item.id === sourceId)
  if (!source) return sourceId
  const channel = document.channels.find((item) => item.id === source.channelId)
  const room = channel?.name ?? source.handle
  return `${room} · ${source.platform}`
}
