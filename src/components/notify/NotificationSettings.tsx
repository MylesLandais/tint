import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import type { NotificationSettings, NotifyChannel } from './contracts'

export type NotificationSettingsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange'
> & {
  settings: NotificationSettings
  onChange: (next: NotificationSettings) => void
  /** Source ids + labels for per-source overrides. */
  sources?: readonly { id: string; label: string }[]
  /** Policy ids + labels for per-policy overrides. */
  policies?: readonly { id: string; label: string }[]
  disabled?: boolean
}

const CHANNELS: readonly NotifyChannel[] = ['off', 'instant', 'digest']

function ChannelSelect({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string
  value: NotifyChannel
  onValueChange: (value: NotifyChannel) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-tint-ink">
      <span className="min-w-0 truncate">{label}</span>
      <select
        className="rounded-md border border-tint-border bg-tint-surface px-2 py-1 text-xs"
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value as NotifyChannel)}
      >
        {CHANNELS.map((channel) => (
          <option key={channel} value={channel}>
            {channel}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Per-source / per-policy channel picker.
 *
 * Settings are a controlled document — the bell derives rows via
 * `deriveFeedNotifications`, so flipping a source to `off` must not leave stale
 * invented toasts in a parallel store.
 */
export function NotificationSettingsPanel({
  settings,
  onChange,
  sources = [],
  policies = [],
  disabled = false,
  className,
  ...props
}: NotificationSettingsProps) {
  return (
    <div
      data-tint-notification-settings=""
      className={cn('flex flex-col gap-4 text-sm', className)}
      {...props}
    >
      <ChannelSelect
        label="Default"
        value={settings.defaultChannel}
        disabled={disabled}
        onValueChange={(defaultChannel) => onChange({ ...settings, defaultChannel })}
      />

      {sources.length > 0 ? (
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 px-0 text-xs font-semibold tracking-wide text-tint-muted uppercase">
            By source
          </legend>
          {sources.map((source) => (
            <ChannelSelect
              key={source.id}
              label={source.label}
              value={settings.bySource[source.id] ?? settings.defaultChannel}
              disabled={disabled}
              onValueChange={(channel) =>
                onChange({
                  ...settings,
                  bySource: { ...settings.bySource, [source.id]: channel },
                })
              }
            />
          ))}
        </fieldset>
      ) : null}

      {policies.length > 0 ? (
        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-1 px-0 text-xs font-semibold tracking-wide text-tint-muted uppercase">
            By policy
          </legend>
          {policies.map((policy) => (
            <ChannelSelect
              key={policy.id}
              label={policy.label}
              value={settings.byPolicy[policy.id] ?? settings.defaultChannel}
              disabled={disabled}
              onValueChange={(channel) =>
                onChange({
                  ...settings,
                  byPolicy: { ...settings.byPolicy, [policy.id]: channel },
                })
              }
            />
          ))}
        </fieldset>
      ) : null}

      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 px-0 text-xs font-semibold tracking-wide text-tint-muted uppercase">
          Quiet hours
        </legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(settings.quietHours)}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...settings,
                quietHours: event.target.checked ? { start: '22:00', end: '07:00' } : null,
              })
            }
          />
          Suppress instant delivery overnight
        </label>
        {settings.quietHours ? (
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1 text-xs text-tint-muted">
              Start
              <input
                type="time"
                className="rounded-md border border-tint-border bg-tint-surface px-2 py-1 text-xs text-tint-ink"
                value={settings.quietHours.start}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    quietHours: { ...settings.quietHours!, start: event.target.value },
                  })
                }
              />
            </label>
            <label className="flex items-center gap-1 text-xs text-tint-muted">
              End
              <input
                type="time"
                className="rounded-md border border-tint-border bg-tint-surface px-2 py-1 text-xs text-tint-ink"
                value={settings.quietHours.end}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    quietHours: { ...settings.quietHours!, end: event.target.value },
                  })
                }
              />
            </label>
          </div>
        ) : null}
      </fieldset>
    </div>
  )
}
