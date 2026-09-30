import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { BreadcrumbItem as CoreBreadcrumbItem, NavigationItem as CoreNavigationItem } from '../../../core/navigation'

export type NavigationContent = string | Snippet
export type NavigationItem = CoreNavigationItem<NavigationContent>
export type BreadcrumbItem = CoreBreadcrumbItem<NavigationContent>

export type NavigationListProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  items: readonly NavigationItem[]
  activeHref?: string
  label?: string
  /** Replaces the anchor; render `content` inside a custom link and set its active state. */
  renderLink?: Snippet<[item: NavigationItem, content: Snippet, active: boolean]>
  onNavigate?: (item: NavigationItem) => void
}

export type BreadcrumbsProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  items: readonly BreadcrumbItem[]
  label?: string
  /** Replaces a linked crumb; the current crumb is always plain text. */
  renderLink?: Snippet<[item: BreadcrumbItem, content: Snippet]>
}

export type AppShellProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  brand?: NavigationContent
  header?: NavigationContent
  search?: NavigationContent
  actions?: NavigationContent
  sidebar?: NavigationContent
  breadcrumbs?: NavigationContent
  children?: Snippet
  sidebarOpen: boolean
  onSidebarOpenChange: (open: boolean) => void
  sidebarLabel?: string
}
