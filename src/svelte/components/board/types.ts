import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { BoardCard as BoardCardModel, BoardLane, BoardLayoutVariant } from '../../../core/board'
import type { MasonryDensity } from '../../../core/table/masonry'

export type BoardCardProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> & {
  card: BoardCardModel
  selected?: boolean
  onSelect?: (cardId: string) => void
  children?: Snippet
  actions?: Snippet
}

export type BoardDetailProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'title'> & {
  card: BoardCardModel | null
  children?: Snippet
  empty?: string | Snippet
}

export type BoardLayoutProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onselect'> & {
  cards: readonly BoardCardModel[]
  lanes: readonly BoardLane[]
  variant?: BoardLayoutVariant
  selectedId?: string | null
  onSelect?: (cardId: string) => void
  renderActions?: Snippet<[card: BoardCardModel]>
  renderPreview?: Snippet<[card: BoardCardModel]>
  empty?: string | Snippet
  density?: MasonryDensity
  targetWidth?: number
  gap?: number
  label?: string
}

export type BoardLayoutToggleProps = {
  value: BoardLayoutVariant
  onChange: (variant: BoardLayoutVariant) => void
  class?: string
  disabled?: boolean
}
