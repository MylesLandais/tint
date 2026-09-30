export type NavigableItem = { disabled?: boolean }

/** Find the next enabled item, wrapping around a list. Returns -1 if none exists. */
export function nextEnabledIndex(
  items: readonly NavigableItem[],
  current: number,
  direction: 1 | -1,
): number {
  if (items.length === 0) return -1
  const start = current < 0 ? (direction === 1 ? -1 : items.length) : current
  for (let step = 1; step <= items.length; step += 1) {
    const index = (start + direction * step + items.length * 2) % items.length
    if (!items[index].disabled) return index
  }
  return -1
}

/** Find the first or last enabled item. Returns -1 if every item is disabled. */
export function edgeEnabledIndex(items: readonly NavigableItem[], edge: 'first' | 'last'): number {
  const start = edge === 'first' ? 0 : items.length - 1
  const direction = edge === 'first' ? 1 : -1
  for (let index = start; index >= 0 && index < items.length; index += direction) {
    if (!items[index].disabled) return index
  }
  return -1
}

/** Search forward from the current item, wrapping and ignoring disabled entries. */
export function typeaheadIndex(
  items: readonly (NavigableItem & { label: string })[],
  query: string,
  current: number,
): number {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle || items.length === 0) return -1
  for (let step = 1; step <= items.length; step += 1) {
    const index = (current + step + items.length) % items.length
    const item = items[index]
    if (!item.disabled && item.label.trim().toLocaleLowerCase().startsWith(needle)) return index
  }
  return -1
}
