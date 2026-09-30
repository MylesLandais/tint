export type NavRailItem = {
  id: string
  label: string
  href: string
  disabled?: boolean
}

export type NavGroup<TItem extends NavRailItem = NavRailItem> = {
  id: string
  label?: string
  items: readonly TItem[]
}

export type FlatNavItem<TItem extends NavRailItem = NavRailItem> = {
  item: TItem
  divider: boolean
}

export function flattenNavGroups<TItem extends NavRailItem>(groups: readonly NavGroup<TItem>[]): FlatNavItem<TItem>[] {
  return groups.flatMap((group, groupIndex) =>
    group.items.map((item, itemIndex) => ({ item, divider: groupIndex > 0 && itemIndex === 0 })))
}

export type CommandPaletteItem = {
  id: string
  label: string
  description?: string
  keywords?: readonly string[]
  group?: string
  shortcut?: string
  disabled?: boolean
}

export function filterCommands(items: readonly CommandPaletteItem[], query: string): CommandPaletteItem[] {
  const tokens = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
  return items.filter((item) => tokens.every((token) =>
    `${item.label} ${item.description ?? ''} ${item.keywords?.join(' ') ?? ''} ${item.group ?? ''}`
      .toLocaleLowerCase().includes(token)))
}

export function nextCommandIndex(items: readonly CommandPaletteItem[], active: number, key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End'): number {
  const enabled = items.map((item, index) => item.disabled ? -1 : index).filter((index) => index >= 0)
  if (!enabled.length) return -1
  if (key === 'Home') return enabled[0]
  if (key === 'End') return enabled[enabled.length - 1]
  const current = enabled.indexOf(active)
  const next = key === 'ArrowDown' ? current + 1 : current - 1
  return enabled[(next + enabled.length) % enabled.length]
}

export type WorkspaceTab = { id: string; label: string; disabled?: boolean }

export function nextWorkspaceTabId(tabs: readonly WorkspaceTab[], currentId: string, key: string): string | null {
  if (!['Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(key)) return null
  const enabled = tabs.filter((tab) => !tab.disabled)
  if (!enabled.length) return null
  if (key === 'Home') return enabled[0].id
  if (key === 'End') return enabled[enabled.length - 1].id
  const index = enabled.findIndex((tab) => tab.id === currentId)
  const offset = key === 'ArrowRight' ? 1 : -1
  return enabled[(index + offset + enabled.length) % enabled.length].id
}
