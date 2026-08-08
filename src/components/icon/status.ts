import { AlertCircle, CheckCircle2, CircleDashed, LoaderCircle, ShieldCheck, X, XCircle } from 'lucide-react'
import type { StatusName, StatusPresentation } from './types'

/**
 * Generalizes the state → icon map that used to live only in ChatParts.tsx.
 * Every entry declares `spin` explicitly — `satisfies` alone would otherwise
 * infer a union where only `loading`'s literal type carries the field, and
 * `STATUS_ICONS[status]` for a non-literal `status` couldn't access it.
 */
export const STATUS_ICONS = {
  idle: { icon: CircleDashed, label: 'Idle', tone: 'text-tint-muted', spin: false },
  pending: { icon: CircleDashed, label: 'Pending', tone: 'text-tint-muted', spin: false },
  loading: { icon: LoaderCircle, label: 'Loading', tone: 'text-tint-info-ink', spin: true },
  success: { icon: CheckCircle2, label: 'Complete', tone: 'text-tint-success-ink', spin: false },
  error: { icon: XCircle, label: 'Failed', tone: 'text-tint-danger-ink', spin: false },
  warning: { icon: AlertCircle, label: 'Warning', tone: 'text-tint-warning-ink', spin: false },
  'needs-approval': {
    icon: ShieldCheck,
    label: 'Needs approval',
    tone: 'text-tint-warning-ink',
    spin: false,
  },
  cancelled: { icon: X, label: 'Cancelled', tone: 'text-tint-muted', spin: false },
} as const satisfies Record<StatusName, StatusPresentation>
