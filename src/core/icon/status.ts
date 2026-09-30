export type StatusName =
  | 'idle'
  | 'pending'
  | 'loading'
  | 'success'
  | 'error'
  | 'warning'
  | 'needs-approval'
  | 'cancelled'

/** Colour role, resolved to `var(--tint-<tone>)` by the binding layer. */
export type StatusTone = 'muted' | 'info-ink' | 'success-ink' | 'danger-ink' | 'warning-ink'

export type StatusPresentation = {
  /** Accessible name when the consumer supplies none. */
  label: string
  tone: StatusTone
  spin: boolean
}

/** Framework-neutral half of the status registry; glyphs are bound per framework. */
export const STATUS_PRESENTATION = {
  idle: { label: 'Idle', tone: 'muted', spin: false },
  pending: { label: 'Pending', tone: 'muted', spin: false },
  loading: { label: 'Loading', tone: 'info-ink', spin: true },
  success: { label: 'Complete', tone: 'success-ink', spin: false },
  error: { label: 'Failed', tone: 'danger-ink', spin: false },
  warning: { label: 'Warning', tone: 'warning-ink', spin: false },
  'needs-approval': { label: 'Needs approval', tone: 'warning-ink', spin: false },
  cancelled: { label: 'Cancelled', tone: 'muted', spin: false },
} as const satisfies Record<StatusName, StatusPresentation>
