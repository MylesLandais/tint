export type SettingsItem = {
  id: string
  label: string
  group?: string
  shortcut?: string
  description?: string
}

export type SettingsGroup = { heading?: string; items: SettingsItem[] }

export function filterSettings(items: readonly SettingsItem[], query: string): SettingsItem[] {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return [...items]
  return items.filter((item) => `${item.label} ${item.group ?? ''} ${item.description ?? ''}`.toLocaleLowerCase().includes(normalized))
}

/** Group headings keep first-seen order; ungrouped rows follow grouped rows. */
export function groupSettings(items: readonly SettingsItem[]): SettingsGroup[] {
  const groups = new Map<string, SettingsItem[]>()
  const ungrouped: SettingsItem[] = []
  for (const item of items) {
    if (!item.group) { ungrouped.push(item); continue }
    const group = groups.get(item.group) ?? []
    group.push(item)
    groups.set(item.group, group)
  }
  return [
    ...Array.from(groups, ([heading, groupedItems]) => ({ heading, items: groupedItems })),
    ...(ungrouped.length ? [{ items: ungrouped }] : []),
  ]
}
