import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { ActivityEvent, ActivitySort } from '../../../core/activity'

export type ActivityFeedRowProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'onselect'> & {
  event: ActivityEvent
  selected?: boolean
  onSelect?: (eventId: string) => void
  actions?: Snippet
}

export type ActivityFeedProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onselect'> & {
  events: readonly ActivityEvent[]
  sort?: ActivitySort
  onSortChange?: (sort: ActivitySort) => void
  selectedId?: string | null
  onSelect?: (eventId: string) => void
  renderActions?: Snippet<[event: ActivityEvent]>
  empty?: string | Snippet
  now?: number
}
