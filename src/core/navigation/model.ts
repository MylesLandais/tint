/** Navigation data and layout decisions shared by the framework bindings. */
export type NavigationItem<TContent = string> = {
  id: string
  label: TContent
  href: string
  icon?: TContent
  badge?: TContent
  disabled?: boolean
}

export type BreadcrumbItem<TContent = string> = {
  id: string
  label: TContent
  href?: string
}

export type NavigationEntry<TContent> = {
  item: NavigationItem<TContent>
  active: boolean
}

export type BreadcrumbEntry<TContent> = {
  item: BreadcrumbItem<TContent>
  current: boolean
  linked: boolean
}

/** Match the React navigation contract: a link is active only on an exact href. */
export function navigationEntries<TContent>(items: readonly NavigationItem<TContent>[], activeHref?: string): NavigationEntry<TContent>[] {
  return items.map((item) => ({ item, active: item.href === activeHref }))
}

/** The last crumb is always current, even when it has an href. */
export function breadcrumbEntries<TContent>(items: readonly BreadcrumbItem<TContent>[]): BreadcrumbEntry<TContent>[] {
  return items.map((item, index) => {
    const current = index === items.length - 1
    return { item, current, linked: !current && Boolean(item.href) }
  })
}

/** Keep this threshold in sync with AppShell's container query. */
export const INLINE_SIDEBAR_MIN_WIDTH = 1024

export function sidebarPresentation(containerWidth: number, hasSidebar: boolean): 'none' | 'overlay' | 'inline' {
  if (!hasSidebar) return 'none'
  return containerWidth >= INLINE_SIDEBAR_MIN_WIDTH ? 'inline' : 'overlay'
}
