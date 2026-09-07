import { useEffect, useState, type ReactNode } from 'react'
import { Search } from 'lucide-react'
import { DOC_GROUPS, DOC_ROUTES, ROUTE_GROUPS, findRoute, hrefFor, type DocRoutePath } from '../routes'
import { ThemeControls } from '../components/ThemeControls'
import { Icon } from '../../components/icon'
import { cn } from '../../lib/utils'
import { SearchPalette } from './SearchPalette'
import { AppShell } from '../../components/navigation'

export type DocsShellProps = {
  /** Undefined on the landing page. */
  current?: DocRoutePath
  children: ReactNode
}

/**
 * The application frame every docs page lives inside, Mintlify-style: a 3rem
 * sticky header, a fixed `w-56` sidebar grouped by `ROUTE_GROUPS`, and a right
 * TOC rail fed by the route's registered sections. Replaces the old per-page
 * `DocsNav` breadcrumb — the shell owns chrome, pages own content.
 */
export function DocsShell({ current, children }: DocsShellProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Route changes close the mobile drawer; the palette manages itself.
  useEffect(() => setNavOpen(false), [current])

  const brand = (
    <a href="#/" className="flex items-center gap-2 font-semibold tracking-tight text-tint-ink">
      <span aria-hidden="true" className="inline-flex size-6 items-center justify-center rounded-md bg-tint-accent text-xs text-tint-on-accent">t</span>
      tint
    </a>
  )
  const actions = (
    <>
      <button type="button" onClick={() => setSearchOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-full border border-tint-border bg-tint-panel py-1.5 pr-2 pl-3 text-sm text-tint-muted transition-colors hover:border-tint-border-strong hover:text-tint-ink">
        <Icon icon={Search} size="sm" /><span className="hidden sm:inline">Search…</span><kbd className="rounded-full bg-tint-surface px-1.5 py-0.5 text-xs font-semibold text-tint-muted">⌘K</kbd>
      </button>
      <ThemeControls />
    </>
  )

  return (
    <>
      <AppShell
        brand={brand}
        actions={actions}
        sidebar={<SidebarNav current={current} />}
        sidebarOpen={navOpen}
        onSidebarOpenChange={setNavOpen}
        sidebarLabel="Documentation"
      >
        <div className="flex">
          <div className="min-w-0 flex-1">{children}</div>
          <TableOfContents current={current} />
        </div>
      </AppShell>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

function SidebarNav({ current, className }: { current?: DocRoutePath; className?: string }) {
  return (
    <nav
      aria-label="Documentation"
      className={cn(
        'min-h-full overflow-y-auto bg-tint-panel px-1 py-2 text-sm',
        className,
      )}
    >
      <SidebarLink href="#/" label="Overview" active={!current} />
      {DOC_GROUPS.map((group) => (
        <div key={group} className="mt-6">
          <p className="m-0 mb-1 px-3 text-xs font-semibold text-tint-ink">{group}</p>
          {DOC_ROUTES.filter((route) => ROUTE_GROUPS[route.path] === group).map((route) => (
            <SidebarLink
              key={route.path}
              href={hrefFor(route)}
              label={route.label}
              active={route.path === current}
            />
          ))}
        </div>
      ))}
    </nav>
  )
}

function SidebarLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'block rounded-md px-3 py-1.5 transition-colors',
        active ? 'font-medium text-tint-accent' : 'text-tint-muted hover:text-tint-accent',
      )}
    >
      {label}
    </a>
  )
}

/**
 * Right-rail "On this page" list with scroll-spy. Items are buttons rather than
 * anchor links: the route lives in the hash, so `#usage` would clobber it.
 */
function TableOfContents({ current }: { current?: DocRoutePath }) {
  const sections = (current ? findRoute(current)?.sections : undefined) ?? []
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setActiveId(null)
    const currentSections = (current ? findRoute(current)?.sections : undefined) ?? []
    if (currentSections.length === 0) return

    // Lazy pages mount their sections a tick after the route change.
    let observer: IntersectionObserver | undefined
    const timeout = window.setTimeout(() => {
      const visible = new Set<string>()
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target.id)
            else visible.delete(entry.target.id)
          }
          const first = currentSections.find((section) => visible.has(section.id))
          if (first) setActiveId(first.id)
        },
        { rootMargin: '-10% 0px -70% 0px' },
      )
      for (const section of currentSections) {
        const element = document.getElementById(section.id)
        if (element) observer.observe(element)
      }
    }, 100)

    return () => {
      window.clearTimeout(timeout)
      observer?.disconnect()
    }
  }, [current])

  if (sections.length === 0) return null

  return (
    <aside className="sticky top-12 hidden h-[calc(100vh-3rem)] w-64 shrink-0 overflow-y-auto px-6 pt-10 pb-8 xl:block">
      <p className="m-0 mb-2 text-xs font-semibold text-tint-ink">On this page</p>
      <ul className="m-0 list-none space-y-1 p-0 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(section.id)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className={cn(
                'cursor-pointer border-l-2 py-1 pl-3 text-left transition-colors',
                activeId === section.id
                  ? 'border-tint-accent font-medium text-tint-accent'
                  : 'border-transparent text-tint-muted hover:text-tint-ink',
              )}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
