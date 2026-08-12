import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FULLSCREEN_EVENTS,
  exitFullscreen,
  getFullscreenElement,
  isFullscreenSupported,
  requestElementFullscreen,
} from './fullscreen'

/**
 * Drive an element between inline, native fullscreen, and an in-page fallback.
 *
 * Two players each grew their own copy of this — the same state pair, the same
 * listener effect, the same Escape handler, the same body-scroll lock, differing
 * only in class names. The copies had already started to drift.
 *
 * `isFullscreen` is *derived* from the two independent sources rather than
 * stored. Both copies kept it as its own state and wrote it from a handler that
 * closed over `theaterMode`, which forced the listener effect to re-subscribe on
 * every theater toggle and still left the value one render stale.
 *
 * Deliberately presentation-free: it returns state and a toggle, never class
 * names. `src/index.css`'s `@source "./components"` does not scan `src/lib`, so
 * a Tailwind class produced here would be dropped from consumers' builds.
 */

/**
 * Theater mode hides body scroll. Two players open at once would each save the
 * *current* value and restore it on close, so the first to close would restore
 * the second's `hidden`. Counted, so the last one out restores the original.
 *
 * Exported so other full-viewport overlays (chat lightbox) share the same lock.
 */
let scrollLockCount = 0
let scrollLockPrevious = ''

export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (scrollLockCount === 0) {
    scrollLockPrevious = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLockCount += 1
  return () => {
    scrollLockCount -= 1
    if (scrollLockCount === 0) document.body.style.overflow = scrollLockPrevious
  }
}

export const OVERLAY_FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

const FOCUSABLE = OVERLAY_FOCUSABLE

export type UseFullscreenOptions = {
  /**
   * Called when the effective fullscreen state settles.
   *
   * Canvas engines that measure on resize need a nudge after the browser has
   * finished reflowing; this is the hook for that, rather than a stray timer at
   * the call site.
   */
  onChange?: (active: boolean) => void
}

export type UseFullscreen = {
  /** True in either native fullscreen or the in-page fallback. */
  isFullscreen: boolean
  /** True only in the in-page fallback, which the caller styles itself. */
  theaterMode: boolean
  toggle: () => void
}

export function useFullscreen(
  ref: { current: HTMLElement | null },
  { onChange }: UseFullscreenOptions = {},
): UseFullscreen {
  const [apiFullscreen, setApiFullscreen] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)
  const isFullscreen = apiFullscreen || theaterMode

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // No dependencies: the handler reads the DOM and the ref, never state. The
  // copies this replaces keyed this effect on `theaterMode` purely so their
  // handler could read it, re-subscribing on every toggle.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const handle = () => setApiFullscreen(getFullscreenElement() === ref.current)
    for (const event of FULLSCREEN_EVENTS) document.addEventListener(event, handle)
    return () => {
      for (const event of FULLSCREEN_EVENTS) document.removeEventListener(event, handle)
    }
  }, [ref])

  useEffect(() => {
    onChangeRef.current?.(isFullscreen)
  }, [isFullscreen])

  /**
   * Theater mode is a modal: it covers the page, so it has to behave like one.
   * Escape closes it, the page beneath stops scrolling, focus moves in and is
   * restored on the way out, and Tab cycles within it rather than walking off
   * into a background the user cannot see.
   */
  useEffect(() => {
    if (!theaterMode) return
    const container = ref.current
    const restoreTo = document.activeElement as HTMLElement | null
    const releaseScroll = lockBodyScroll()

    container?.focus?.()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTheaterMode(false)
        return
      }
      if (event.key !== 'Tab' || !container) return
      const focusable = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const active = document.activeElement
      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      releaseScroll()
      restoreTo?.focus?.()
    }
  }, [theaterMode, ref])

  const toggle = useCallback(() => {
    const element = ref.current
    if (!element) return

    if (getFullscreenElement() === element) {
      void exitFullscreen().catch(() => undefined)
      return
    }
    if (theaterMode) {
      setTheaterMode(false)
      return
    }
    // Asked rather than caught: on iOS there is no element fullscreen at all, and
    // discovering that through a rejected promise on every tap means the button
    // can never say what it will actually do.
    if (!isFullscreenSupported(element)) {
      setTheaterMode(true)
      return
    }
    void requestElementFullscreen(element).catch(() => setTheaterMode(true))
  }, [ref, theaterMode])

  return { isFullscreen, theaterMode, toggle }
}
