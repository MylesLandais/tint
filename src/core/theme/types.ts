/** `system` leaves `data-scheme` unset so CSS follows the operating system. */
export type ColorSchemePreference = 'system' | 'light' | 'dark'
export type ResolvedColorScheme = 'light' | 'dark'
export type ColorSchemeState = {
  preference: ColorSchemePreference
  resolved: ResolvedColorScheme
  setPreference: (preference: ColorSchemePreference) => void
}
export type ThemeNameState = {
  theme: string
  setTheme: (theme: string) => void
}
export type ThemeOption = { value: string; label: string }

/**
 * User display scale. It multiplies the root font size, so every rem-based
 * size (text, spacing, control heights) grows together, like a "larger text"
 * system setting. `default` leaves `data-display-scale` unset.
 */
export type DisplayScale = 'compact' | 'default' | 'large' | 'larger'
export type DisplayScaleState = {
  scale: DisplayScale
  setScale: (scale: DisplayScale) => void
}

export const DISPLAY_SCALE_OPTIONS = [
  { value: 'compact', label: 'Compact' },
  { value: 'default', label: 'Default' },
  { value: 'large', label: 'Large' },
  { value: 'larger', label: 'Larger' },
] as const satisfies readonly { value: DisplayScale; label: string }[]

export function isDisplayScale(value: unknown): value is DisplayScale {
  return DISPLAY_SCALE_OPTIONS.some((option) => option.value === value)
}

export const SCHEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ColorSchemePreference; label: string }[]

export function nextColorSchemePreference(current: ColorSchemePreference, delta: -1 | 1): ColorSchemePreference {
  const index = SCHEME_OPTIONS.findIndex((option) => option.value === current)
  return SCHEME_OPTIONS[(index + delta + SCHEME_OPTIONS.length) % SCHEME_OPTIONS.length].value
}
