import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { FeedEntry, FeedLayoutVariant, SourceHealth, TextHighlight } from '../../../core/feed'

export type FeedEntryCardProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'onselect'> & {
  entry: FeedEntry
  sourceLabel?: string
  selected?: boolean
  onSelect?: (entryId: string) => void
  actions?: Snippet
}

export type FeedEntryRowProps = FeedEntryCardProps

export type FeedLayoutProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onselect'> & {
  entries: readonly FeedEntry[]
  variant?: FeedLayoutVariant
  sourceLabels?: Readonly<Record<string, string>>
  selectedId?: string | null
  onSelect?: (entryId: string) => void
  renderActions?: Snippet<[entry: FeedEntry]>
  empty?: string | Snippet
}

export type ReaderPaneProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  header?: string | Snippet
  highlightLayer?: Snippet
  children: Snippet
}

export type SelectionToolbarAction = { id: string; label: string; icon?: string | Snippet; danger?: boolean; disabled?: boolean }
export type SelectionToolbarProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  position: { x: number; y: number } | null
  open: boolean
  actions: readonly SelectionToolbarAction[]
  onAction: (actionId: string) => void
}

export type ViewModeToggleProps = {
  value: FeedLayoutVariant
  onChange: (variant: FeedLayoutVariant) => void
  options?: readonly FeedLayoutVariant[]
  class?: string
  disabled?: boolean
}

export type SourceHealthBadgeProps = { health: SourceHealth; class?: string }

export type SplitPaneProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  start: Snippet
  middle: Snippet
  end?: Snippet
  startWidth?: string
  middleWidth?: string
  endWidth?: string
  onStartWidthChange?: (widthPx: number) => void
  onMiddleWidthChange?: (widthPx: number) => void
  minPanePx?: number
}

export type HighlightLayerProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  text: string
  highlights: readonly TextHighlight[]
  activeId?: string | null
  onHighlightClick?: (id: string) => void
}

export type NarrationTransportProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  src: string
  label?: string
  rates?: readonly number[]
  onEnded?: () => void
}
