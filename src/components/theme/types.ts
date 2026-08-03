import type { ButtonHTMLAttributes, HTMLAttributes, SelectHTMLAttributes } from 'react'

/**
 * What the reader chose. `system` is the absence of a choice — it defers to the
 * operating system and is represented in the DOM by having no `data-scheme`
 * attribute at all.
 */
export type ColorSchemePreference = 'system' | 'light' | 'dark'

/** What the preference actually resolved to once the system was consulted. */
export type ResolvedColorScheme = 'light' | 'dark'

export type ColorSchemeState = {
  /** The stored three-state choice. */
  preference: ColorSchemePreference
  /** `preference` with `system` collapsed to whatever the OS reports. */
  resolved: ResolvedColorScheme
  /** Persists the choice and stamps `<html data-scheme>`. */
  setPreference: (preference: ColorSchemePreference) => void
}

export type ThemeNameState = {
  /** The active palette family. */
  theme: string
  /** Persists the choice and stamps `<html data-theme>`. */
  setTheme: (theme: string) => void
}

export type ThemeToggleProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'children'
> & {
  value: ColorSchemePreference
  onChange: (preference: ColorSchemePreference) => void
  /** Accessible name for the group. */
  label?: string
  /** Render labels beside the icons instead of icon-only. */
  showLabels?: boolean
}

export type ThemeToggleOptionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean
}

export type ThemeOption = {
  /** Written to `data-theme`. Use `'tint'` for the built-in default. */
  value: string
  label: string
}

export type ThemePickerProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange'
> & {
  value: string
  onChange: (theme: string) => void
  themes: readonly ThemeOption[]
  /** Accessible name for the control. */
  label?: string
}
