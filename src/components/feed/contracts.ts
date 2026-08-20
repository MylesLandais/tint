/**
 * Host-owned feed document — GraphDocument-shaped, React-free.
 *
 * Tint presents this; Kino (or a docs demo store) owns mutation and crawl. The
 * collections are `readonly` and replaced wholesale so `revision` stays honest.
 */

export type FeedId = string
export type RevisionToken = string

export type SourcePlatform =
  | 'youtube'
  | 'rss'
  | 'web'
  | 'forum'
  | 'other'

export type SourceHealth = 'healthy' | 'unreachable' | 'inactive' | 'dormant'

export type Source = {
  id: string
  /** Display handle or site label. */
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
  sources: readonly Source[]
  entries: readonly FeedEntry[]
  matches: readonly PolicyMatch[]
  metadata: Record<string, unknown>
}

export function nextFeedRevision(current: RevisionToken): RevisionToken {
  const n = Number.parseInt(current.replace(/\D/g, ''), 10)
  return `r${Number.isFinite(n) ? n + 1 : 1}`
}
