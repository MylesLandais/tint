/**
 * Activity stream contracts — Digg/Lobsters density, Level1Techs-shaped forum expansion.
 *
 * Activity is a separate document from FeedDocument: different rows, different sort,
 * not a density toggle on the same list.
*/

import type { Identity } from '../identity'

export type ActivityId = string
export type RevisionToken = string

export type ActivitySignal =
  | 'hot'
  | 'new'
  | 'top'
  | 'rising'
  | 'artifact'
  | 'notify'
  | 'intent'

export type ActivityEvent = {
  id: string
  rank?: number
  title: string
  href: string
  publishedAt: string
  signals: readonly ActivitySignal[]
  score: number
  commentCount: number
  shareCount: number
  /** Source / author attribution line. */
  attribution: string
  actor?: Identity
  sourceId?: string
  entryId?: string
  /** When set, the activity page can expand a Level1Techs-shaped thread. */
  threadId?: string
}

/**
 * Forum room inside ActivityDocument.
 *
 * Shares `{ id, name, slug }` with feed `Channel` so a thread can live under the
 * same routeable room (e.g. `channel/gaming`). Types are not merged yet — feed
 * and activity documents stay independent until a later unify.
 */
export type ForumChannel = {
  id: string
  name: string
  slug: string
}

export type ForumThread = {
  id: string
  channelId: string
  title: string
  createdAt: string
  replyCount: number
}

export type ForumPost = {
  id: string
  threadId: string
  author: Identity | string
  createdAt: string
  body: string
  depth: number
}

export type CrossPost = {
  id: string
  fromThreadId: string
  toThreadId: string
  note?: string
}

export type ActivityDocument = {
  schemaVersion: string
  id: ActivityId
  revision: RevisionToken
  events: readonly ActivityEvent[]
  channels: readonly ForumChannel[]
  threads: readonly ForumThread[]
  posts: readonly ForumPost[]
  crossPosts: readonly CrossPost[]
  metadata: Record<string, unknown>
}

export type ActivitySort = 'hot' | 'new' | 'top'

/** Digg-ish ranking: hot mixes recency with score; top is score; new is time. */
export function sortActivityEvents(
  events: readonly ActivityEvent[],
  sort: ActivitySort,
  now = Date.now(),
): ActivityEvent[] {
  const scored = events.map((event) => {
    const ageHours = Math.max(
      0.25,
      (now - Date.parse(event.publishedAt)) / (1000 * 60 * 60),
    )
    const hot = event.score / Math.pow(ageHours + 2, 1.5)
    return { event, hot }
  })

  scored.sort((a, b) => {
    if (sort === 'new') {
      return a.event.publishedAt < b.event.publishedAt
        ? 1
        : a.event.publishedAt > b.event.publishedAt
          ? -1
          : 0
    }
    if (sort === 'top') {
      return b.event.score - a.event.score
    }
    return b.hot - a.hot
  })

  return scored.map(({ event }, index) => ({ ...event, rank: index + 1 }))
}
