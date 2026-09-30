import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createThemeState, nextColorSchemePreference } from './index'

beforeEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.scheme
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('theme preference state', () => {
  it('adopts prepaint DOM attributes before stored values and notifies subscribers', () => {
    localStorage.setItem('tint-theme', 'gruvbox')
    localStorage.setItem('tint-color-scheme', 'light')
    document.documentElement.dataset.theme = 'mocha'
    document.documentElement.dataset.scheme = 'dark'
    const state = createThemeState()
    expect(state.getTheme()).toBe('mocha')
    expect(state.getPreference()).toBe('dark')
    const themes = vi.fn()
    const schemes = vi.fn()
    const stopTheme = state.subscribeTheme(themes)
    const stopScheme = state.subscribePreference(schemes)
    state.setTheme('latte')
    state.setPreference('light')
    expect(document.documentElement.dataset.theme).toBe('latte')
    expect(document.documentElement.dataset.scheme).toBe('light')
    expect(localStorage.getItem('tint-theme')).toBe('latte')
    expect(localStorage.getItem('tint-color-scheme')).toBe('light')
    expect(themes).toHaveBeenCalledOnce()
    expect(schemes).toHaveBeenCalledOnce()
    stopTheme(); stopScheme()
    state.setTheme('tint')
    state.setPreference('system')
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(document.documentElement.dataset.scheme).toBeUndefined()
    expect(localStorage.getItem('tint-theme')).toBeNull()
    expect(localStorage.getItem('tint-color-scheme')).toBeNull()
    expect(themes).toHaveBeenCalledOnce()
    expect(schemes).toHaveBeenCalledOnce()
  })

  it('falls back to storage and remains usable when storage throws', () => {
    localStorage.setItem('tint-theme', 'solarized')
    localStorage.setItem('tint-color-scheme', 'dark')
    const state = createThemeState()
    expect(state.getTheme()).toBe('solarized')
    expect(state.getPreference()).toBe('dark')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    state.setTheme('mocha')
    state.setPreference('light')
    expect(document.documentElement.dataset.theme).toBe('mocha')
    expect(document.documentElement.dataset.scheme).toBe('light')
  })

  it('keeps system resolution separate from the three-state choice', () => {
    const onChange = vi.fn()
    const media = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }
    vi.stubGlobal('matchMedia', vi.fn(() => media as unknown as MediaQueryList))
    const state = createThemeState()
    expect(state.getPreference()).toBe('system')
    expect(state.getSystemScheme()).toBe('dark')
    const stop = state.subscribeSystem(onChange)
    expect(media.addEventListener).toHaveBeenCalledWith('change', onChange)
    stop()
    expect(media.removeEventListener).toHaveBeenCalledWith('change', onChange)
    expect(nextColorSchemePreference('dark', 1)).toBe('light')
    expect(nextColorSchemePreference('light', -1)).toBe('dark')
  })
})
