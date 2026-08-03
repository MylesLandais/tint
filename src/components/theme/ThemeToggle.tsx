import { Monitor, Moon, Sun } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import type { ColorSchemePreference, ThemeToggleProps } from './types'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const satisfies readonly {
  value: ColorSchemePreference
  label: string
  icon: typeof Sun
}[]

/**
 * A three-state light / system / dark control.
 *
 * Controlled, like the rest of the library — `useColorScheme` owns the state and
 * this renders it, so an app with its own preference store can drop its values
 * in without inheriting a second source of truth.
 *
 * Implemented as a radiogroup: one tab stop, arrows move between options, and
 * moving selects. That is the WAI-ARIA pattern for an exclusive choice, and it
 * is why this is not three `aria-pressed` buttons.
 */
export function ThemeToggle({
  value,
  onChange,
  label = 'Color scheme',
  showLabels = false,
  className,
  onKeyDown,
  ...props
}: ThemeToggleProps) {
  const groupRef = useRef<HTMLDivElement>(null)

  const move = (delta: number) => {
    const index = OPTIONS.findIndex((option) => option.value === value)
    const next = OPTIONS[(index + delta + OPTIONS.length) % OPTIONS.length]
    if (!next) return
    onChange(next.value)
    // Selection follows focus, so focus has to follow selection too.
    groupRef.current
      ?.querySelector<HTMLButtonElement>(`[data-scheme-option="${next.value}"]`)
      ?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      move(1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(-1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      onChange(OPTIONS[0].value)
    } else if (event.key === 'End') {
      event.preventDefault()
      onChange(OPTIONS[OPTIONS.length - 1].value)
    }
    onKeyDown?.(event)
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={label}
      data-tint-theme-toggle=""
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-tint-border bg-tint-surface p-0.5',
        className,
      )}
      {...props}
    >
      {OPTIONS.map(({ value: option, label: optionLabel, icon: Icon }) => {
        const selected = option === value
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={showLabels ? undefined : optionLabel}
            data-scheme-option={option}
            // Roving tab stop: the group is a single stop, arrows do the rest.
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
              selected
                ? 'bg-tint-panel text-tint-ink shadow-sm'
                : 'text-tint-muted hover:text-tint-ink',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {showLabels ? optionLabel : null}
          </button>
        )
      })}
    </div>
  )
}
