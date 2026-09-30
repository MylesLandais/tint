export type TextHighlight = {
  id: string
  /** Inclusive start index into the plain-text body the host measured. */
  start: number
  /** Exclusive end index. */
  end: number
  tone?: 'accent' | 'warning' | 'success'
}

export type HighlightPiece = { key: string; content: string; highlight?: TextHighlight }

/** Clip out-of-range and overlapping spans, preserving each character once. */
export function highlightPieces(text: string, highlights: readonly TextHighlight[]): HighlightPiece[] {
  const sorted = [...highlights].sort((a, b) => a.start - b.start || a.end - b.end)
  const pieces: HighlightPiece[] = []
  let cursor = 0
  for (const highlight of sorted) {
    const start = Math.max(cursor, Math.max(0, Math.min(text.length, highlight.start)))
    const end = Math.max(start, Math.max(0, Math.min(text.length, highlight.end)))
    if (start > cursor) pieces.push({ key: `t-${cursor}`, content: text.slice(cursor, start) })
    if (end > start) pieces.push({ key: highlight.id, content: text.slice(start, end), highlight })
    cursor = end
  }
  if (cursor < text.length) pieces.push({ key: `t-${cursor}`, content: text.slice(cursor) })
  return pieces
}
