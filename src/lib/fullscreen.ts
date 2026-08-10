/**
 * Cross-browser fullscreen, and the in-page fallback for when it is refused.
 *
 * Two players wanted this and each grew its own copy: the maximize control kept
 * the element's `max-w-*` and radius, so "fullscreen" rendered a postcard on a
 * black screen. Fixing that needs the API *and* the CSS *and* a fallback, which
 * is more than a call site should carry — hence `useFullscreen`.
 *
 * The prefixed spellings are not decoration. `:fullscreen` is unprefixed
 * everywhere current, but a UA reached through a prefixed *event* never fires
 * `fullscreenchange`, so the readback silently never flips and the control stays
 * stuck on "Enter fullscreen" while the element is plainly fullscreen.
 */

type FullscreenElement = Element & {
  webkitRequestFullscreen?: () => Promise<void> | void
  webkitRequestFullScreen?: () => Promise<void> | void
  mozRequestFullScreen?: () => Promise<void> | void
  msRequestFullscreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  mozFullScreenElement?: Element | null
  msFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
  webkitCancelFullScreen?: () => Promise<void> | void
  mozCancelFullScreen?: () => Promise<void> | void
  msExitFullscreen?: () => Promise<void> | void
}

/** `document` when there is one. Guarded so importing this never throws in SSR. */
function ownerDocument(): FullscreenDocument | null {
  return typeof document === 'undefined' ? null : (document as FullscreenDocument)
}

export function getFullscreenElement(): Element | null {
  const doc = ownerDocument()
  if (!doc) return null
  return (
    doc.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  )
}

/**
 * Whether this element can be fullscreened at all.
 *
 * iOS Safari is the case that matters: it implements fullscreen only on
 * `<video>` via `webkitEnterFullscreen`, never on an arbitrary element. Asking
 * first lets a caller choose the in-page fallback deliberately, instead of
 * discovering it by catching a rejection on every tap.
 */
export function isFullscreenSupported(element?: Element | null): boolean {
  const doc = ownerDocument()
  if (!doc) return false
  const target = (element ?? doc.documentElement) as FullscreenElement
  return (
    typeof target.requestFullscreen === 'function' ||
    typeof target.webkitRequestFullscreen === 'function' ||
    typeof target.webkitRequestFullScreen === 'function' ||
    typeof target.mozRequestFullScreen === 'function' ||
    typeof target.msRequestFullscreen === 'function'
  )
}

export async function requestElementFullscreen(element: Element): Promise<void> {
  const target = element as FullscreenElement
  if (typeof target.requestFullscreen === 'function') return void (await target.requestFullscreen())
  if (typeof target.webkitRequestFullscreen === 'function') return void (await target.webkitRequestFullscreen())
  if (typeof target.webkitRequestFullScreen === 'function') return void (await target.webkitRequestFullScreen())
  if (typeof target.mozRequestFullScreen === 'function') return void (await target.mozRequestFullScreen())
  if (typeof target.msRequestFullscreen === 'function') return void (await target.msRequestFullscreen())
  throw new Error('Fullscreen API is unavailable')
}

/**
 * Exit fullscreen.
 *
 * Document-scoped, like the platform API it wraps — there is only ever one
 * fullscreen element, and it is not necessarily yours. Callers that care should
 * compare `getFullscreenElement()` to their own node first.
 */
export async function exitFullscreen(): Promise<void> {
  const doc = ownerDocument()
  if (!doc || getFullscreenElement() == null) return
  if (typeof doc.exitFullscreen === 'function') return void (await doc.exitFullscreen())
  if (typeof doc.webkitExitFullscreen === 'function') return void (await doc.webkitExitFullscreen())
  if (typeof doc.webkitCancelFullScreen === 'function') return void (await doc.webkitCancelFullScreen())
  if (typeof doc.mozCancelFullScreen === 'function') return void (await doc.mozCancelFullScreen())
  if (typeof doc.msExitFullscreen === 'function') return void (await doc.msExitFullscreen())
}

export const FULLSCREEN_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
  'mozfullscreenchange',
  'MSFullscreenChange',
] as const
