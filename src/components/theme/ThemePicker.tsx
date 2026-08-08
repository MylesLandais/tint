import { ChevronDown, Palette } from 'lucide-react'
import { useId } from 'react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'
import type { ThemePickerProps } from './types'

/**
 * Palette family picker.
 *
 * A native `<select>` rather than a custom listbox: the option set is small,
 * static, and this way it inherits platform keyboard behavior, mobile pickers,
 * and `color-scheme`-aware rendering for free.
 *
 * Controlled — pair it with `useThemeName`. The available themes are a property
 * of which theme stylesheets the app imported, so they are passed in.
 */
export function ThemePicker({
  value,
  onChange,
  themes,
  label = 'Theme',
  className,
  ...props
}: ThemePickerProps) {
  const id = useId()

  return (
    <div className="inline-flex items-center gap-2" data-tint-theme-picker="">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative inline-flex items-center">
        <Icon
          icon={Palette}
          size="sm"
          className="pointer-events-none absolute left-2.5 text-tint-muted"
        />
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'h-8 appearance-none rounded-lg border border-tint-border bg-tint-surface py-0 pr-7 pl-8 text-xs font-medium text-tint-ink outline-none hover:bg-tint-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
            className,
          )}
          {...props}
        >
          {themes.map((theme) => (
            <option key={theme.value} value={theme.value}>
              {theme.label}
            </option>
          ))}
        </select>
        <Icon
          icon={ChevronDown}
          size="sm"
          className="pointer-events-none absolute right-2 text-tint-muted"
        />
      </div>
    </div>
  )
}
