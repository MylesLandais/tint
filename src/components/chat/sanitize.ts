/**
 * Unicode bidirectional formatting characters that can reorder surrounding text
 * without being visible: the embeddings and overrides (U+202A–U+202E) and the
 * isolates (U+2066–U+2069).
 *
 * These are a spoofing primitive rather than a rendering nicety. A filename of
 * `invoice\u202Egnp.exe` displays as `invoiceexe.png`, which is why actor names,
 * filenames, and link titles are stripped before they reach the DOM.
 *
 * Directional *marks* (U+200E/U+200F/U+061C) are deliberately left alone — they
 * carry no reordering power of their own and legitimately appear in mixed
 * left-to-right and right-to-left names.
 */
const BIDI_CONTROLS = /[\u202A-\u202E\u2066-\u2069]/
const BIDI_CONTROLS_GLOBAL = new RegExp(BIDI_CONTROLS.source, 'g')

/**
 * Remove invisible bidirectional control characters from untrusted text.
 *
 * Returns the input unchanged when there is nothing to strip, so the common path
 * — every message render — allocates nothing.
 */
export function stripBidi(value: string): string {
  return BIDI_CONTROLS.test(value)
    ? value.replace(BIDI_CONTROLS_GLOBAL, '')
    : value
}

/**
 * Return `href` when it is safe to navigate to, otherwise `undefined`.
 *
 * Same-document and same-origin-relative targets pass through. Everything else
 * must parse as a URL with an `http:`, `https:`, or `mailto:` scheme, which
 * rejects `javascript:`, `data:`, `vbscript:`, and `file:`.
 */
export function safeHref(href?: string): string | undefined {
  if (!href) return undefined
  if (href.startsWith('/') || href.startsWith('#')) return href

  try {
    const url = new URL(href)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? href : undefined
  } catch {
    return undefined
  }
}
