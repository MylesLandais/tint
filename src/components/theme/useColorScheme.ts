import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type {
  ColorSchemePreference,
  ColorSchemeState,
  ResolvedColorScheme,
} from './types'

export const COLOR_SCHEME_STORAGE_KEY = 'tint-color-scheme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function isPreference(value: unknown): value is ColorSchemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

/**
 * The DOM is consulted before storage on purpose.
 *
 * The pre-paint script stamps `data-scheme` before React runs, so at hydration
 * the attribute is the authority — reading it keeps the first client render
 * identical to what is already on screen. Storage is the fallback for apps that
 * skipped the script, which flash but still end up correct.
 */
function readInitialPreference(): ColorSchemePreference {
  if (typeof document === 'undefined') return 'system'

  const attribute = document.documentElement.dataset.scheme
  if (attribute === 'light' || attribute === 'dark') return attribute

  try {
    const stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (isPreference(stored)) return stored
  } catch {
    // Storage can throw in private modes and sandboxed frames. A themed page is
    // not worth breaking a render over.
  }
  return 'system'
}

let preference: ColorSchemePreference | undefined
const listeners = new Set<() => void>()

function getPreference(): ColorSchemePreference {
  preference ??= readInitialPreference()
  return preference
}

function getServerPreference(): ColorSchemePreference {
  return 'system'
}

function subscribePreference(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

/** Stamp the choice onto <html>. `system` removes the attribute entirely, which
 *  is what hands control back to `color-scheme: light dark`. */
function applyPreference(next: ColorSchemePreference) {
  if (typeof document === 'undefined') return
  if (next === 'system') {
    delete document.documentElement.dataset.scheme
  } else {
    document.documentElement.dataset.scheme = next
  }
}

function setStoredPreference(next: ColorSchemePreference) {
  preference = next
  applyPreference(next)

  try {
    if (next === 'system') {
      window.localStorage.removeItem(COLOR_SCHEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next)
    }
  } catch {
    // Preference is still applied for this session; it just will not survive.
  }

  // Every mounted toggle updates, not only the one that was clicked.
  for (const listener of listeners) listener()
}

function subscribeSystem(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function getSystemScheme(): ResolvedColorScheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function getServerSystemScheme(): ResolvedColorScheme {
  return 'light'
}

/**
 * The reader's light/dark preference, as a three-state value.
 *
 * Both snapshots are primitives, so `useSyncExternalStore` never sees a new
 * object identity and cannot tear. State lives at module scope, which is what
 * keeps two toggles on the same page in agreement.
 */
export function useColorScheme(): ColorSchemeState {
  const preferenceValue = useSyncExternalStore(
    subscribePreference,
    getPreference,
    getServerPreference,
  )
  const systemScheme = useSyncExternalStore(
    subscribeSystem,
    getSystemScheme,
    getServerSystemScheme,
  )

  // Reconciles the DOM for apps without the pre-paint script, and after
  // hydration when the server could only assume `system`.
  useEffect(() => {
    applyPreference(preferenceValue)
  }, [preferenceValue])

  const setPreference = useCallback((next: ColorSchemePreference) => {
    setStoredPreference(next)
  }, [])

  return {
    preference: preferenceValue,
    resolved: preferenceValue === 'system' ? systemScheme : preferenceValue,
    setPreference,
  }
}
