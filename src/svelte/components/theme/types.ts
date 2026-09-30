import type { HTMLAttributes, HTMLSelectAttributes } from 'svelte/elements'
import type { ColorSchemePreference, ThemeOption } from '../../../core/theme'

export type ThemeToggleProps = Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> & {
  value: ColorSchemePreference
  onChange: (preference: ColorSchemePreference) => void
  label?: string
  showLabels?: boolean
  disabled?: boolean
  class?: string
}

export type ThemePickerProps = Omit<HTMLSelectAttributes, 'value' | 'onchange' | 'children' | 'class'> & {
  value: string
  onChange: (theme: string) => void
  themes: readonly ThemeOption[]
  label?: string
  class?: string
}
