import { useCallback, useEffect, useState } from 'react'

/** How long the "copied" confirmation stays visible. */
export const COPY_FEEDBACK_MS = 1600

/**
 * Copy-to-clipboard with transient confirmation.
 *
 * `copied` only flips true once the write actually resolves. The Clipboard API
 * rejects on a denied permission, an unfocused document, or an insecure context,
 * and reporting success in those cases tells the reader their message is on the
 * clipboard when it is not.
 *
 * Resolves to whether the write succeeded so callers can surface their own
 * failure affordance.
 */
export function useCopied(value: string) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = useCallback(async () => {
    if (!value) return false
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      return true
    } catch {
      setCopied(false)
      return false
    }
  }, [value])

  return { copied, copy }
}
