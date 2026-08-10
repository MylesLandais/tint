import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  exitElementFullscreen,
  getFullscreenElement,
  requestElementFullscreen,
} from './fullscreen'

describe('fullscreen helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('reads the standard fullscreen element', () => {
    const node = document.createElement('div')
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => node,
    })
    expect(getFullscreenElement()).toBe(node)
  })

  it('requests fullscreen on the element', async () => {
    const node = document.createElement('div')
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(node, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    await requestElementFullscreen(node)
    expect(requestFullscreen).toHaveBeenCalledOnce()
  })

  it('exits fullscreen via the document API', async () => {
    const exitFullscreen = vi.fn().mockResolvedValue(undefined)
    const node = document.createElement('div')
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => node,
    })
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    })
    await exitElementFullscreen()
    expect(exitFullscreen).toHaveBeenCalledOnce()
  })
})
