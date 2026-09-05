import type { HTMLAttributes, ReactNode } from 'react'
import { AlertTriangle, CloudOff, Inbox, RefreshCw } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../button'
import { Icon } from '../icon'
import type { ConnectionState } from '../../client'

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  lines?: number
  label?: string
}

export function Skeleton({ lines = 3, label = 'Loading', className, ...props }: SkeletonProps) {
  return (
    <div role="status" aria-label={label} className={cn('grid animate-pulse gap-2 motion-reduce:animate-none', className)} {...props}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <span key={index} aria-hidden="true" className="h-3 rounded bg-tint-border last:w-2/3" />
      ))}
    </div>
  )
}

export type StateViewProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}

function StateView({ title, description, action, icon, className, ...props }: StateViewProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-6 py-10 text-center', className)} {...props}>
      {icon ? <span className="text-tint-muted">{icon}</span> : null}
      <h3 className="m-0 text-sm font-semibold text-tint-ink">{title}</h3>
      {description ? <p className="m-0 max-w-md text-sm text-tint-muted">{description}</p> : null}
      {action}
    </div>
  )
}

export type EmptyStateProps = Omit<StateViewProps, 'icon'> & { icon?: ReactNode }
export function EmptyState({ icon = <Icon icon={Inbox} size="lg" />, ...props }: EmptyStateProps) {
  return <StateView data-tint-empty-state="" icon={icon} {...props} />
}

export type ErrorStateProps = Omit<StateViewProps, 'icon' | 'action'> & {
  icon?: ReactNode
  retryLabel?: string
  onRetry?: () => void
  action?: ReactNode
}
export function ErrorState({ icon = <Icon icon={AlertTriangle} size="lg" />, retryLabel = 'Try again', onRetry, action, ...props }: ErrorStateProps) {
  return (
    <StateView
      role="alert"
      data-tint-error-state=""
      icon={icon}
      action={action ?? (onRetry ? <Button onClick={onRetry} leading={<Icon icon={RefreshCw} size="sm" />}>{retryLabel}</Button> : undefined)}
      {...props}
    />
  )
}

export type ConnectionStatusProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  state: ConnectionState
  labels?: Partial<Record<ConnectionState, string>>
  onRetry?: () => void
}

const DEFAULT_LABELS: Record<ConnectionState, string> = {
  idle: 'Idle', connecting: 'Connecting…', online: 'Online', reconnecting: 'Reconnecting…', offline: 'Offline', error: 'Connection error',
}

export function ConnectionStatus({ state, labels, onRetry, className, ...props }: ConnectionStatusProps) {
  const label = labels?.[state] ?? DEFAULT_LABELS[state]
  return (
    <div
      role="status"
      aria-live="polite"
      data-tint-connection-status=""
      data-state={state}
      className={cn('inline-flex items-center gap-2 text-sm text-tint-muted', className)}
      {...props}
    >
      <Icon icon={state === 'offline' || state === 'error' ? CloudOff : RefreshCw} size="sm" className={cn((state === 'connecting' || state === 'reconnecting') && 'animate-spin motion-reduce:animate-none')} />
      <span>{label}</span>
      {onRetry && (state === 'offline' || state === 'error') ? <Button size="sm" variant="ghost" onClick={onRetry}>Retry</Button> : null}
    </div>
  )
}
