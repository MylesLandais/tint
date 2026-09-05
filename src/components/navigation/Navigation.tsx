import { Menu as MenuIcon, X } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../button'
import { Icon } from '../icon'

export type NavigationItem = {
  id: string
  label: ReactNode
  href: string
  icon?: ReactNode
  badge?: ReactNode
  disabled?: boolean
}

export type NavigationListProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  items: readonly NavigationItem[]
  activeHref?: string
  label?: string
  renderLink?: (item: NavigationItem, content: ReactNode, active: boolean) => ReactNode
  onNavigate?: (item: NavigationItem) => void
}

export function NavigationList({ items, activeHref, label = 'Primary navigation', renderLink, onNavigate, className, ...props }: NavigationListProps) {
  return (
    <nav aria-label={label} className={className} {...props}>
      <ul className="m-0 grid list-none gap-1 p-0">
        {items.map((item) => {
          const active = item.href === activeHref
          const content = (
            <>
              {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge}
            </>
          )
          return (
            <li key={item.id}>
              {renderLink ? renderLink(item, content, active) : (
                <a
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  aria-disabled={item.disabled || undefined}
                  onClick={(event) => {
                    if (item.disabled) event.preventDefault()
                    else onNavigate?.(item)
                  }}
                  className={cn(
                    'flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm text-tint-muted no-underline transition hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
                    active && 'bg-tint-accent-soft font-medium text-tint-accent',
                    item.disabled && 'pointer-events-none opacity-50',
                  )}
                >
                  {content}
                </a>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export type BreadcrumbItem = { id: string; label: ReactNode; href?: string }
export type BreadcrumbsProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  items: readonly BreadcrumbItem[]
  label?: string
  renderLink?: (item: BreadcrumbItem, content: ReactNode) => ReactNode
}

export function Breadcrumbs({ items, label = 'Breadcrumb', renderLink, className, ...props }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={className} {...props}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-1 p-0 text-sm text-tint-muted">
        {items.map((item, index) => {
          const current = index === items.length - 1
          const content = <span aria-current={current ? 'page' : undefined}>{item.label}</span>
          return (
            <li key={item.id} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {!current && item.href ? (renderLink ? renderLink(item, content) : <a href={item.href}>{content}</a>) : content}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export type AppShellProps = HTMLAttributes<HTMLDivElement> & {
  brand?: ReactNode
  header?: ReactNode
  search?: ReactNode
  actions?: ReactNode
  sidebar?: ReactNode
  breadcrumbs?: ReactNode
  sidebarOpen: boolean
  onSidebarOpenChange(open: boolean): void
  sidebarLabel?: string
}

export function AppShell({
  brand,
  header,
  search,
  actions,
  sidebar,
  breadcrumbs,
  sidebarOpen,
  onSidebarOpenChange,
  sidebarLabel = 'Navigation',
  className,
  children,
  ...props
}: AppShellProps) {
  return (
    <div
      data-tint-app-shell=""
      className={cn('min-h-dvh overflow-x-hidden bg-tint-bg text-tint-ink', className)}
      {...props}
    >
      <header className="sticky top-0 z-30 flex min-h-14 items-center gap-3 border-b border-tint-border bg-tint-panel/95 px-4 backdrop-blur">
        {sidebar ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={sidebarOpen ? `Close ${sidebarLabel}` : `Open ${sidebarLabel}`}
            aria-expanded={sidebarOpen}
            className="lg:hidden"
            leading={<Icon icon={sidebarOpen ? X : MenuIcon} />}
            onClick={() => onSidebarOpenChange(!sidebarOpen)}
          />
        ) : null}
        {brand ? <div className="shrink-0">{brand}</div> : null}
        {header ? <div className="min-w-0 flex-1">{header}</div> : <div className="flex-1" />}
        {search ? <div className="hidden min-w-0 flex-1 md:block">{search}</div> : null}
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      <div className={cn('grid min-h-[calc(100dvh-3.5rem)]', sidebar && 'lg:grid-cols-[17rem_minmax(0,1fr)]')}>
        {sidebar ? (
          <>
            {sidebarOpen ? <button type="button" aria-label={`Close ${sidebarLabel}`} className="fixed inset-0 z-20 bg-tint-ink/40 lg:hidden" onClick={() => onSidebarOpenChange(false)} /> : null}
            <aside
              aria-label={sidebarLabel}
              data-open={sidebarOpen || undefined}
              className={cn(
                'fixed inset-y-14 left-0 z-20 w-72 overflow-auto border-r border-tint-border bg-tint-panel p-3 transition-transform lg:static lg:w-auto lg:translate-x-0',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
              )}
            >
              {sidebar}
            </aside>
          </>
        ) : null}
        <main className="min-w-0">
          {breadcrumbs ? <div className="border-b border-tint-border px-4 py-2">{breadcrumbs}</div> : null}
          {children}
        </main>
      </div>
    </div>
  )
}
