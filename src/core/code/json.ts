/** Formatting only: callers choose which evidence is safe to expose. */
export type JsonText =
  | { status: 'ready'; text: string }
  | { status: 'unavailable' | 'invalid'; text?: never }

export function jsonText(value: unknown): JsonText {
  if (value === undefined) return { status: 'unavailable' }
  try {
    const text = JSON.stringify(value, null, 2)
    return text === undefined ? { status: 'invalid' } : { status: 'ready', text }
  } catch {
    return { status: 'invalid' }
  }
}
