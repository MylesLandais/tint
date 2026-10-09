import type { ArtifactStatus, SourceHealth } from './contracts'

export type FeedLayoutVariant = 'wall' | 'list' | 'magazine' | 'ticker' | 'carousel' | 'feed'

export const DEFAULT_FEED_LAYOUT_OPTIONS: readonly FeedLayoutVariant[] = [
  'feed', 'list', 'magazine', 'wall', 'carousel', 'ticker',
]

const VARIANT_LABEL: Record<FeedLayoutVariant, string> = {
  feed: 'Feed', list: 'List', magazine: 'Magazine', wall: 'Wall', carousel: 'Carousel', ticker: 'Ticker',
}

export function feedLayoutLabel(variant: FeedLayoutVariant): string {
  return VARIANT_LABEL[variant]
}

export function artifactBadge(status?: ArtifactStatus): { label: string; tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'accent' } | null {
  if (!status || status === 'none') return null
  switch (status) {
    case 'ready':
      return { label: 'ready', tone: 'success' }
    case 'downloading':
    case 'validating':
      return { label: status, tone: 'info' }
    case 'unlocking':
    case 'discovering':
      return { label: status, tone: 'warning' }
    case 'queued':
      return { label: 'queued', tone: 'neutral' }
    case 'failed':
      return { label: 'failed', tone: 'danger' }
    default:
      return { label: status, tone: 'info' }
  }
}

const HEALTH_TONE: Record<SourceHealth, 'success' | 'neutral' | 'warning' | 'danger'> = {
  healthy: 'success', dormant: 'neutral', inactive: 'warning', unreachable: 'danger',
}

export function sourceHealthBadge(health: SourceHealth): { label: SourceHealth; tone: 'success' | 'neutral' | 'warning' | 'danger' } {
  return { label: health, tone: HEALTH_TONE[health] }
}
