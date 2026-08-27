import { ThemePicker, ThemeToggle, useColorScheme, useThemeName } from '../../components/theme'

/**
 * The docs site's appearance controls.
 *
 * The library ships the toggles as controlled components and the state as hooks;
 * this is the seam where they meet. Every docs page renders one of these in its
 * header, which is why the wiring lives in a single place rather than four.
 */
const THEMES = [
  { value: 'tint', label: 'Tint' },
  { value: 'solarized', label: 'Solarized' },
  { value: 'gruvbox', label: 'Gruvbox' },
  // The Catppuccin flavors each pin a scheme, so the toggle beside this picker
  // moves only the native chrome while one of them is selected.
  { value: 'latte', label: 'Catppuccin Latte' },
  { value: 'frappe', label: 'Catppuccin Frappé' },
  { value: 'macchiato', label: 'Catppuccin Macchiato' },
  { value: 'mocha', label: 'Catppuccin Mocha' },
] as const

export function ThemeControls() {
  const { preference, setPreference } = useColorScheme()
  const { theme, setTheme } = useThemeName()

  return (
    <div className="flex items-center gap-2">
      <ThemePicker
        value={theme}
        onChange={setTheme}
        themes={THEMES}
        className="hidden sm:inline-flex"
      />
      <ThemeToggle value={preference} onChange={setPreference} />
    </div>
  )
}
