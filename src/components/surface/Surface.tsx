import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type SurfaceTone = 'default' | 'subtle' | 'accent' | 'danger'
export type SurfaceElevation = 'none' | 'sm' | 'md' | 'lg'

export type SurfaceProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside'
  tone?: SurfaceTone
  elevation?: SurfaceElevation
  interactive?: boolean
  selected?: boolean
}

const TONE: Record<SurfaceTone, string> = {
  default: 'border-tint-border bg-tint-panel text-tint-ink',
  subtle: 'border-tint-border bg-tint-surface text-tint-ink',
  accent: 'border-tint-accent/40 bg-tint-accent-soft text-tint-ink',
  danger: 'border-tint-danger/40 bg-tint-danger-soft text-tint-danger-ink',
}

const ELEVATION: Record<SurfaceElevation, string> = {
  none: '', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg',
}

export function Surface({
  as: Component = 'div',
  tone = 'default',
  elevation = 'none',
  interactive = false,
  selected = false,
  className,
  ...props
}: SurfaceProps) {
  return (
    <Component
      data-tint-surface=""
      data-tone={tone}
      data-elevation={elevation}
      data-interactive={interactive || undefined}
      data-selected={selected || undefined}
      className={cn(
        'rounded-xl border', TONE[tone], ELEVATION[elevation],
        interactive && 'transition hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
        selected && 'ring-2 ring-tint-accent', className,
      )}
      {...props}
    />
  )
}

export type CardProps = SurfaceProps & {
  header?: ReactNode
  footer?: ReactNode
  actions?: ReactNode
  bodyClassName?: string
}

export function Card({ header, footer, actions, children, bodyClassName, ...props }: CardProps) {
  return (
    <Surface as="article" data-tint-card="" {...props}>
      {header || actions ? (
        <header className="flex items-start justify-between gap-3 border-b border-tint-border px-4 py-3">
          <div className="min-w-0 flex-1">{header}</div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn('px-4 py-3', bodyClassName)}>{children}</div>
      {footer ? <footer className="border-t border-tint-border px-4 py-3">{footer}</footer> : null}
    </Surface>
  )
}
