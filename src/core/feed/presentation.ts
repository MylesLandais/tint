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

export function artifactBadge(status?: ArtifactStatus): { label: string; tone: 'success' | 'info' } | null {
  if (!status || status === 'none') return null
  return { label: status, tone: status === 'ready' ? 'success' : 'info' }
}

const HEALTH_TONE: Record<SourceHealth, 'success' | 'neutral' | 'warning' | 'danger'> = {
  healthy: 'success', dormant: 'neutral', inactive: 'warning', unreachable: 'danger',
}

export function sourceHealthBadge(health: SourceHealth): { label: SourceHealth; tone: 'success' | 'neutral' | 'warning' | 'danger' } {
  return { label: health, tone: HEALTH_TONE[health] }
}
