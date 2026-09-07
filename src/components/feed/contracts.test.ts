import { describe, expect, it } from 'vitest'
import {
  channelForSource,
  channelPath,
  entriesForChannel,
  resolveAttribution,
  sourcesForChannel,
  type Channel,
  type FeedDocument,
  type Source,
} from './contracts'

const channels: Channel[] = [
  { id: 'ch-a', slug: 'misskatie', name: 'MissKatie' },
  { id: 'ch-b', slug: 'gaming', name: 'Gaming' },
]

const sources: Source[] = [
  {
    id: 's-yt',
    channelId: 'ch-a',
    handle: '@misskatie',
    url: 'https://youtube.com/@misskatie',
    platform: 'youtube',
    workflowName: 'youtube-poll',
    health: 'healthy',
    unreadCount: 1,
  },
  {
    id: 's-tt',
    channelId: 'ch-a',
    handle: '@misskatie',
    url: 'https://tiktok.com/@misskatie',
    platform: 'tiktok',
    workflowName: 'tiktok-poll',
    health: 'healthy',
    unreadCount: 0,
  },
  {
    id: 's-game',
    channelId: 'ch-b',
    handle: 'gaming-rss',
    url: 'https://example.com/gaming.rss',
    platform: 'rss',
    workflowName: 'rss-poll',
    health: 'healthy',
    unreadCount: 2,
  },
]

const document = {
  channels,
  sources,
  entries: [
    {
      id: 'e1',
      sourceId: 's-yt',
      title: 'One',
      url: '#',
      publishedAt: '2026-08-01T00:00:00.000Z',
      excerpt: '',
      tags: [],
      readState: 'unread' as const,
      contentKind: 'video' as const,
    },
    {
      id: 'e2',
      sourceId: 's-game',
      title: 'Two',
      url: '#',
      publishedAt: '2026-08-01T00:00:00.000Z',
      excerpt: '',
      tags: [],
      readState: 'unread' as const,
      contentKind: 'article' as const,
    },
  ],
} satisfies Pick<FeedDocument, 'channels' | 'sources' | 'entries'>

describe('channel helpers', () => {
  it('builds channel paths', () => {
    expect(channelPath(channels[0]!)).toBe('channel/misskatie')
  })

  it('lists sources and entries for a channel', () => {
    expect(sourcesForChannel(document, 'ch-a').map((source) => source.id)).toEqual([
      's-yt',
      's-tt',
    ])
    expect(entriesForChannel(document, 'ch-a').map((entry) => entry.id)).toEqual(['e1'])
  })

  it('resolves channel from source and attribution', () => {
    expect(channelForSource(document, 's-yt')?.slug).toBe('misskatie')
    expect(resolveAttribution(document, 's-yt')).toBe('MissKatie · youtube')
  })
})
