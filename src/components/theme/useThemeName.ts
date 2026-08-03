import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { ThemeNameState } from './types'

export const THEME_STORAGE_KEY = 'tint-theme'

/** The palette that ships applied at `:root`, so it needs no attribute. */
export const DEFAULT_THEME = 'tint'

function readInitialTheme(): string {
  if (typeof document === 'undefined') return DEFAULT_THEME

  const attribute = document.documentElement.dataset.theme
  if (attribute) return attribute

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

let theme: string | undefined
const listeners = new Set<() => void>()

function getTheme(): string {
  theme ??= readInitialTheme()
  return theme
}

function getServerTheme(): string {
  return DEFAULT_THEME
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function applyTheme(next: string) {
  if (typeof document === 'undefined') return
  if (next === DEFAULT_THEME) {
    delete document.documentElement.dataset.theme
  } else {
    document.documentElement.dataset.theme = next
  }
}

function setStoredTheme(next: string) {
  theme = next
  applyTheme(next)

  try {
    if (next === DEFAULT_THEME) {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    }
  } catch {
    // Applied for this session even if it cannot be persisted.
  }

  for (const listener of listeners) listener()
}

/**
 * The active palette family, stamped onto `<html data-theme>`.
 *
 * The hook does not know which themes exist — that depends on which theme
 * stylesheets the app imported — so it stores whatever string it is given.
 */
export function useThemeName(): ThemeNameState {
  const value = useSyncExternalStore(subscribe, getTheme, getServerTheme)

  useEffect(() => {
    applyTheme(value)
  }, [value])

  const setTheme = useCallback((next: string) => {
    setStoredTheme(next)
  }, [])

  return { theme: value, setTheme }
}
