import { ChevronRight } from 'lucide-react'
import {
  useId,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { Icon } from '../icon'
import { cn } from '../../lib/utils'

export type PanelProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** Always-visible label for the panel disclosure. */
  title: ReactNode
  /** Decorative content rendered before the title, inside the toggle button. */
  icon?: ReactNode
  /** Connection or document state rendered beside the title, outside the button. */
  status?: ReactNode
  /**
   * Controls rendered outside the disclosure button, so they stay
   * independently clickable rather than also toggling the panel.
   */
  actions?: ReactNode
  /**
   * Controlled disclosure state. The body stays mounted while collapsed, which
   * is what preserves scroll position, focus, and any editor or terminal state
   * living inside it.
   */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** Extra classes for the header row. */
  headerClassName?: string
  /**
   * Extra classes for the body wrapper.
   *
   * Avoid `display` utilities here. Collapsing sets the `hidden` attribute,
   * which only yields `display: none` at user-agent priority — any `flex`,
   * `grid`, or `block` class outranks it and leaves a "collapsed" panel fully
   * visible. Put layout on an element inside the body instead.
   */
  bodyClassName?: string
}

export function Panel({
  title,
  icon,
  status,
  actions,
  expanded,
  onExpandedChange,
  headerClassName,
  bodyClassName,
  className,
  children,
  ...props
}: PanelProps) {
  const bodyId = useId()

  return (
    <section
      data-panel=""
      data-expanded={expanded || undefined}
      className={cn(
        'overflow-hidden rounded-xl border border-tint-border bg-tint-panel shadow-sm',
        className,
      )}
      {...props}
    >
      <header
        data-panel-header=""
        className={cn(
          'flex min-h-10 items-center border-b border-tint-border bg-tint-surface',
          !expanded && 'border-b-transparent',
          headerClassName,
        )}
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => onExpandedChange(!expanded)}
          className="flex min-h-10 min-w-0 flex-1 items-center gap-2 px-3 text-left text-sm font-medium text-tint-ink outline-none transition hover:bg-tint-accent-soft focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-tint-accent"
        >
          <Icon
            icon={ChevronRight}
            size="sm"
            className={cn('shrink-0 transition-transform', expanded && 'rotate-90')}
          />
          {icon ? <span className="flex shrink-0 items-center">{icon}</span> : null}
          <span className="truncate">{title}</span>
        </button>

        {status ? (
          <div className="flex min-w-0 items-center px-2 text-xs font-normal text-tint-muted">
            {status}
          </div>
        ) : null}

        {actions ? (
          <div
            data-panel-actions=""
            className="flex shrink-0 items-center gap-1 px-2"
          >
            {actions}
          </div>
        ) : null}
      </header>

      <div
        id={bodyId}
        data-panel-body=""
        hidden={!expanded}
        className={bodyClassName}
      >
        {children}
      </div>
    </section>
  )
}
