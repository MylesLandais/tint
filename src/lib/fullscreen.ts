/** Cross-browser Fullscreen API helpers (standard + webkit). */

type FullscreenElement = Element & {
  webkitRequestFullscreen?: () => Promise<void> | void
  webkitRequestFullScreen?: () => Promise<void> | void
}

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
  webkitCancelFullScreen?: () => Promise<void> | void
}

export function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

export async function requestElementFullscreen(element: Element): Promise<void> {
  const target = element as FullscreenElement
  if (typeof target.requestFullscreen === 'function') {
    await target.requestFullscreen()
    return
  }
  if (typeof target.webkitRequestFullscreen === 'function') {
    await target.webkitRequestFullscreen()
    return
  }
  if (typeof target.webkitRequestFullScreen === 'function') {
    await target.webkitRequestFullScreen()
    return
  }
  throw new Error('Fullscreen API is unavailable')
}

export async function exitElementFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument
  if (getFullscreenElement() == null) return
  if (typeof document.exitFullscreen === 'function') {
    await document.exitFullscreen()
    return
  }
  if (typeof doc.webkitExitFullscreen === 'function') {
    await doc.webkitExitFullscreen()
    return
  }
  if (typeof doc.webkitCancelFullScreen === 'function') {
    await doc.webkitCancelFullScreen()
  }
}

export const FULLSCREEN_EVENTS = [
  'fullscreenchange',
  'webkitfullscreenchange',
] as const
