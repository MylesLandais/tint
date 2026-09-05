import type { TransitionPreset } from './contracts'

export type TransitionPresetPickerProps = {
  value: TransitionPreset
  onChange: (preset: TransitionPreset) => void
  disabled?: boolean
  className?: string
}

const OPTIONS: readonly { value: TransitionPreset; label: string; description: string }[] = [
  {
    value: 'long-bass-swap',
    label: 'Long bass swap',
    description: 'Equal-power blend with a midpoint low-EQ handoff.',
  },
  {
    value: 'filter-echo-exit',
    label: 'Filter and echo exit',
    description: 'High-pass and echo the outgoing deck into a sharper handoff.',
  },
]

export function TransitionPresetPicker({
  value,
  onChange,
  disabled = false,
  className,
}: TransitionPresetPickerProps) {
  return (
    <fieldset className={className ?? 'grid gap-2'}>
      <legend className="mb-2 text-sm font-medium">Transition style</legend>
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer gap-3 rounded-md border border-tint-border p-3 has-[:checked]:border-tint-accent"
        >
          <input
            type="radio"
            aria-label={option.label}
            name="transition-preset"
            value={option.value}
            checked={value === option.value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
          />
          <span>
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="block text-xs text-tint-muted">{option.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
