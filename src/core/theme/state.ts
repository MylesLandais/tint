import type { ColorSchemePreference, ResolvedColorScheme } from './types'

export const DEFAULT_THEME = 'tint'
export const THEME_STORAGE_KEY = 'tint-theme'
export const COLOR_SCHEME_STORAGE_KEY = 'tint-color-scheme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function storedValue(key: string): string | null {
  try { return typeof window === 'undefined' ? null : window.localStorage.getItem(key) }
  catch { return null }
}

function persist(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch { /* The choice still applies in this session. */ }
}

function isPreference(value: unknown): value is ColorSchemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

/** Framework-neutral state shared by React and Svelte bindings during migration. */
export function createThemeState() {
  let theme: string | undefined
  let preference: ColorSchemePreference | undefined
  const themeListeners = new Set<() => void>()
  const preferenceListeners = new Set<() => void>()

  function getTheme() {
    if (theme !== undefined) return theme
    theme = typeof document === 'undefined' ? DEFAULT_THEME :
      (document.documentElement.dataset.theme || storedValue(THEME_STORAGE_KEY) || DEFAULT_THEME)
    return theme
  }

  function applyTheme(next: string) {
    if (typeof document === 'undefined') return
    if (next === DEFAULT_THEME) delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = next
  }

  function setTheme(next: string) {
    theme = next
    applyTheme(next)
    persist(THEME_STORAGE_KEY, next === DEFAULT_THEME ? null : next)
    for (const listener of themeListeners) listener()
  }

  function getPreference(): ColorSchemePreference {
    if (preference !== undefined) return preference
    if (typeof document === 'undefined') return 'system'
    const attribute = document.documentElement.dataset.scheme
    const stored = storedValue(COLOR_SCHEME_STORAGE_KEY)
    preference = isPreference(attribute) ? attribute : (isPreference(stored) ? stored : 'system')
    return preference
  }

  function applyPreference(next: ColorSchemePreference) {
    if (typeof document === 'undefined') return
    if (next === 'system') delete document.documentElement.dataset.scheme
    else document.documentElement.dataset.scheme = next
  }

  function setPreference(next: ColorSchemePreference) {
    preference = next
    applyPreference(next)
    persist(COLOR_SCHEME_STORAGE_KEY, next === 'system' ? null : next)
    for (const listener of preferenceListeners) listener()
  }

  function getSystemScheme(): ResolvedColorScheme {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light'
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  }

  function subscribeSystem(listener: () => void) {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const query = window.matchMedia(DARK_QUERY)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }

  return {
    getTheme, setTheme, applyTheme,
    subscribeTheme(listener: () => void) { themeListeners.add(listener); return () => { themeListeners.delete(listener) } },
    getPreference, setPreference, applyPreference,
    subscribePreference(listener: () => void) { preferenceListeners.add(listener); return () => { preferenceListeners.delete(listener) } },
    getSystemScheme, subscribeSystem,
  }
}

export const themeState = createThemeState()
