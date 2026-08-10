import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FULLSCREEN_EVENTS,
  exitFullscreen,
  getFullscreenElement,
  isFullscreenSupported,
  requestElementFullscreen,
} from './fullscreen'

/**
 * These helpers exist for the non-standard paths, and the first version of them
 * tested only the standard ones — three tests, all on `fullscreenElement` /
 * `requestFullscreen` / `exitFullscreen`, with every prefixed branch and the
 * unavailable-API throw uncovered.
 *
 * It also leaked: `vi.restoreAllMocks()` does not undo `Object.defineProperty`,
 * so the first test's `fullscreenElement` getter stayed installed for the rest
 * of the file. Everything installed here is recorded and deleted.
 */
const installed: (keyof Document)[] = []

function stubDocument(key: string, value: unknown) {
  Object.defineProperty(document, key, { value, configurable: true, writable: true })
  installed.push(key as keyof Document)
}

afterEach(() => {
  for (const key of installed.splice(0)) {
    delete (document as unknown as Record<string, unknown>)[key as string]
  }
  vi.restoreAllMocks()
})

describe('getFullscreenElement', () => {
  it('reads the standard property', () => {
    const element = document.createElement('div')
    stubDocument('fullscreenElement', element)
    expect(getFullscreenElement()).toBe(element)
  })

  it.each([
    ['webkitFullscreenElement'],
    ['mozFullScreenElement'],
    ['msFullscreenElement'],
  ])('falls back to %s', (key) => {
    const element = document.createElement('div')
    stubDocument('fullscreenElement', null)
    stubDocument(key, element)
    expect(getFullscreenElement()).toBe(element)
  })

  it('is null when nothing is fullscreen', () => {
    stubDocument('fullscreenElement', null)
    expect(getFullscreenElement()).toBeNull()
  })
})

describe('requestElementFullscreen', () => {
  it.each([
    ['requestFullscreen'],
    ['webkitRequestFullscreen'],
    ['webkitRequestFullScreen'],
    ['mozRequestFullScreen'],
    ['msRequestFullscreen'],
  ])('uses %s when it is the only spelling available', async (key) => {
    const request = vi.fn().mockResolvedValue(undefined)
    const element = Object.assign(document.createElement('div'), { [key]: request })
    // jsdom defines `requestFullscreen` on the prototype; hide it for the
    // prefixed cases so the fallback chain is what actually runs.
    if (key !== 'requestFullscreen') {
      Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true })
    }

    await requestElementFullscreen(element)
    expect(request).toHaveBeenCalledOnce()
  })

  it('throws where no spelling exists, so callers can fall back deliberately', async () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true })
    await expect(requestElementFullscreen(element)).rejects.toThrow('Fullscreen API is unavailable')
  })
})

describe('exitFullscreen', () => {
  it('does nothing when no element is fullscreen', async () => {
    const exit = vi.fn().mockResolvedValue(undefined)
    stubDocument('fullscreenElement', null)
    stubDocument('exitFullscreen', exit)

    await exitFullscreen()
    expect(exit).not.toHaveBeenCalled()
  })

  it.each([
    ['exitFullscreen'],
    ['webkitExitFullscreen'],
    ['webkitCancelFullScreen'],
    ['mozCancelFullScreen'],
    ['msExitFullscreen'],
  ])('uses %s when it is the only spelling available', async (key) => {
    const exit = vi.fn().mockResolvedValue(undefined)
    stubDocument('fullscreenElement', document.createElement('div'))
    if (key !== 'exitFullscreen') stubDocument('exitFullscreen', undefined)
    stubDocument(key, exit)

    await exitFullscreen()
    expect(exit).toHaveBeenCalledOnce()
  })
})

describe('isFullscreenSupported', () => {
  it('is false for an element with no spelling — the iOS Safari case', () => {
    const element = document.createElement('div')
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true })
    expect(isFullscreenSupported(element)).toBe(false)
  })

  it('is true when any spelling is present', () => {
    const element = Object.assign(document.createElement('div'), {
      webkitRequestFullscreen: () => undefined,
    })
    Object.defineProperty(element, 'requestFullscreen', { value: undefined, configurable: true })
    expect(isFullscreenSupported(element)).toBe(true)
  })
})

describe('FULLSCREEN_EVENTS', () => {
  /**
   * A UA reached through a prefixed event never fires `fullscreenchange`, so
   * omitting one of these leaves the readback stuck: the element is fullscreen
   * and the control still reads "Enter fullscreen".
   */
  it('covers every vendor spelling of the change event', () => {
    expect([...FULLSCREEN_EVENTS]).toEqual([
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange',
    ])
  })
})
