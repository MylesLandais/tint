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

export const SCHEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ColorSchemePreference; label: string }[]

export function nextColorSchemePreference(current: ColorSchemePreference, delta: -1 | 1): ColorSchemePreference {
  const index = SCHEME_OPTIONS.findIndex((option) => option.value === current)
  return SCHEME_OPTIONS[(index + delta + SCHEME_OPTIONS.length) % SCHEME_OPTIONS.length].value
}
