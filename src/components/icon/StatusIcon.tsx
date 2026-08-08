import { cn } from '@/lib/utils'
import { Icon } from './Icon'
import { STATUS_ICONS } from './status'
import type { StatusIconProps } from './types'

/** Renders a semantic status (loading, success, error, …) from the shared registry. */
export function StatusIcon({ status, className, label, ...props }: StatusIconProps) {
  const entry = STATUS_ICONS[status]
  return (
    <Icon
      icon={entry.icon}
      label={label}
      className={cn(entry.tone, entry.spin && 'animate-spin motion-reduce:animate-none', className)}
      {...props}
    />
  )
}

/**
 * The most duplicated pattern in the library before this: a bare loading
 * spinner. Deliberately not `<StatusIcon status="loading" />` — every existing
 * spinner call site relies on inheriting its surrounding text color rather
 * than the registry's info tone, so this skips `tone` and only borrows the
 * glyph and spin animation.
 */
export function Spinner({ className, ...props }: Omit<StatusIconProps, 'status'>) {
  return (
    <Icon
      icon={STATUS_ICONS.loading.icon}
      className={cn('animate-spin motion-reduce:animate-none', className)}
      {...props}
    />
  )
}
