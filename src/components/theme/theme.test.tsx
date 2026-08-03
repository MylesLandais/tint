import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemePicker } from './ThemePicker'
import { ThemeToggle } from './ThemeToggle'
import type { ColorSchemePreference } from './types'

/** jsdom has no matchMedia, so the system side of the hook needs one. */
function installMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = prefersDark

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('dark') ? matches : !matches,
      media: query,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
        listeners.add(cb),
      removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
        listeners.delete(cb),
      dispatchEvent: () => false,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    })),
  })

  return {
    setSystem(next: boolean) {
      matches = next
      for (const cb of listeners) cb({ matches: next } as MediaQueryListEvent)
    },
  }
}

/** Module-scope state is shared by design, so each test needs a fresh module. */
async function freshHook() {
  vi.resetModules()
  return (await import('./useColorScheme')).useColorScheme
}

beforeEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.scheme
  delete document.documentElement.dataset.theme
})

afterEach(() => {
  window.localStorage.clear()
})

describe('useColorScheme', () => {
  it('follows the system when there is no stored preference', async () => {
    const media = installMatchMedia(true)
    const useColorScheme = await freshHook()
    const { result } = renderHook(() => useColorScheme())

    expect(result.current.preference).toBe('system')
    expect(result.current.resolved).toBe('dark')
    // `system` is the *absence* of the attribute — that is what hands control
    // back to `color-scheme: light dark`.
    expect(document.documentElement.dataset.scheme).toBeUndefined()

    act(() => media.setSystem(false))
    expect(result.current.resolved).toBe('light')
  })

  it('lets an explicit preference override the system', async () => {
    installMatchMedia(true)
    const useColorScheme = await freshHook()
    const { result } = renderHook(() => useColorScheme())

    act(() => result.current.setPreference('light'))

    expect(result.current.preference).toBe('light')
    expect(result.current.resolved).toBe('light')
    expect(document.documentElement.dataset.scheme).toBe('light')
  })

  it('persists an explicit choice and clears storage when returning to system', async () => {
    installMatchMedia(false)
    const useColorScheme = await freshHook()
    const { result } = renderHook(() => useColorScheme())

    act(() => result.current.setPreference('dark'))
    expect(window.localStorage.getItem('tint-color-scheme')).toBe('dark')

    act(() => result.current.setPreference('system'))
    expect(window.localStorage.getItem('tint-color-scheme')).toBeNull()
    expect(document.documentElement.dataset.scheme).toBeUndefined()
  })

  it('adopts the attribute the pre-paint script already stamped', async () => {
    installMatchMedia(false)
    document.documentElement.dataset.scheme = 'dark'
    const useColorScheme = await freshHook()
    const { result } = renderHook(() => useColorScheme())

    // The DOM wins over storage so the first render matches what is on screen.
    expect(result.current.preference).toBe('dark')
    expect(result.current.resolved).toBe('dark')
  })

  it('falls back to storage when the pre-paint script was skipped', async () => {
    installMatchMedia(false)
    window.localStorage.setItem('tint-color-scheme', 'dark')
    const useColorScheme = await freshHook()
    const { result } = renderHook(() => useColorScheme())

    expect(result.current.preference).toBe('dark')
    expect(document.documentElement.dataset.scheme).toBe('dark')
  })

  it('keeps two mounted consumers in agreement', async () => {
    installMatchMedia(false)
    const useColorScheme = await freshHook()
    const a = renderHook(() => useColorScheme())
    const b = renderHook(() => useColorScheme())

    act(() => a.result.current.setPreference('dark'))

    expect(b.result.current.preference).toBe('dark')
  })

  it('survives storage throwing, as in a sandboxed frame', async () => {
    installMatchMedia(false)
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    const useColorScheme = await freshHook()
    const { result } = renderHook(() => useColorScheme())
    expect(result.current.preference).toBe('system')

    act(() => result.current.setPreference('dark'))
    // Applied for this session even though it could not be persisted.
    expect(result.current.resolved).toBe('dark')
    expect(document.documentElement.dataset.scheme).toBe('dark')

    getItem.mockRestore()
    setItem.mockRestore()
  })

  it('does not throw when matchMedia is unavailable', async () => {
    // @ts-expect-error deliberately removing the API
    delete window.matchMedia
    const useColorScheme = await freshHook()

    expect(() => renderHook(() => useColorScheme())).not.toThrow()
  })
})

describe('ThemeToggle', () => {
  function setup(value: ColorSchemePreference = 'system') {
    const onChange = vi.fn()
    const view = render(<ThemeToggle value={value} onChange={onChange} />)
    return { onChange, view }
  }

  it('exposes an exclusive choice with one tab stop', () => {
    setup('system')
    const group = screen.getByRole('radiogroup', { name: 'Color scheme' })
    const radios = screen.getAllByRole('radio')

    expect(group).toBeInTheDocument()
    expect(radios).toHaveLength(3)
    expect(radios.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()
  })

  it('reports the option that was clicked', () => {
    const { onChange } = setup('system')
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))

    expect(onChange).toHaveBeenCalledWith('dark')
  })

  it('moves selection with the arrow keys and wraps', () => {
    const { onChange } = setup('system')
    const selected = screen.getByRole('radio', { name: 'System' })

    fireEvent.keyDown(selected, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith('dark')

    fireEvent.keyDown(selected, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith('light')
  })

  it('jumps to the ends with Home and End', () => {
    const { onChange } = setup('system')
    const selected = screen.getByRole('radio', { name: 'System' })

    fireEvent.keyDown(selected, { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith('light')

    fireEvent.keyDown(selected, { key: 'End' })
    expect(onChange).toHaveBeenLastCalledWith('dark')
  })

  it('is controlled — clicking does not change what it shows', () => {
    setup('light')
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked()
  })
})

describe('ThemePicker', () => {
  const themes = [
    { value: 'tint', label: 'Tint' },
    { value: 'gruvbox', label: 'Gruvbox' },
  ]

  it('is a labeled select over the supplied themes', () => {
    const onChange = vi.fn()
    render(<ThemePicker value="tint" onChange={onChange} themes={themes} />)

    const select = screen.getByRole('combobox', { name: 'Theme' })
    expect(select).toHaveValue('tint')

    fireEvent.change(select, { target: { value: 'gruvbox' } })
    expect(onChange).toHaveBeenCalledWith('gruvbox')
  })
})
