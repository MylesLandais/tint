/**
 * Dotted-path get/set over a nested form values object.
 *
 * Paths are the field `name`s in a `FormSchema`. Repeatable rows use numeric
 * segments (`data.character_book.entries.0.keys`). The values object is
 * replaced, never mutated — same discipline as `GraphDocument`.
 */

export type FormFileValue = {
  name: string
  mimeType: string
  objectUrl: string
}

export type FormValues = Record<string, unknown>

export function getAtPath(values: unknown, path: string): unknown {
  if (!path) return values
  let current: unknown = values
  for (const part of path.split('.')) {
    if (current == null || typeof current !== 'object') return undefined
    current = Array.isArray(current)
      ? current[Number(part)]
      : (current as Record<string, unknown>)[part]
  }
  return current
}

export function setAtPath(values: FormValues, path: string, value: unknown): FormValues {
  if (!path) return values
  return setParts(values, path.split('.'), value) as FormValues
}

function setParts(source: unknown, parts: readonly string[], value: unknown): unknown {
  if (parts.length === 0) return value
  const head = parts[0]!
  const rest = parts.slice(1)
  const asIndex = Number(head)
  const indexy = Number.isInteger(asIndex) && String(asIndex) === head

  if (Array.isArray(source) || (source == null && indexy)) {
    const next = Array.isArray(source) ? source.slice() : []
    next[asIndex] = setParts(next[asIndex], rest, value)
    return next
  }

  const next: Record<string, unknown> =
    source != null && typeof source === 'object' && !Array.isArray(source)
      ? { ...(source as Record<string, unknown>) }
      : {}
  next[head] = setParts(next[head], rest, value)
  return next
}

export function removeAtIndex(values: FormValues, path: string, index: number): FormValues {
  const list = getAtPath(values, path)
  if (!Array.isArray(list)) return values
  return setAtPath(
    values,
    path,
    list.filter((_, itemIndex) => itemIndex !== index),
  )
}

export function appendAtPath(values: FormValues, path: string, item: unknown): FormValues {
  const list = getAtPath(values, path)
  const next = Array.isArray(list) ? [...list, item] : [item]
  return setAtPath(values, path, next)
}

export function isFormFileValue(value: unknown): value is FormFileValue {
  if (value == null || typeof value !== 'object') return false
  const file = value as FormFileValue
  return typeof file.name === 'string' && typeof file.objectUrl === 'string'
}
