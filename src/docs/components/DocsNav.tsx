import { findRoute, type DocRoutePath, type DocSection } from '../routes'
import { ThemeControls } from './ThemeControls'

export type DocsNavProps = {
  /** Omit on the landing page, which is itself the breadcrumb root. */
  current?: DocRoutePath
}

/**
 * The breadcrumb every docs page renders, for the same reason `ThemeControls`
 * exists: the wiring belongs in one place rather than nine.
 *
 * It deliberately does not list sibling pages. The landing page at `#/` is the
 * component index, so the nav only needs a dependable route back to it — and a
 * per-page list of every sibling is exactly what drifted out of sync before,
 * leaving the Editor and Terminal demos unreachable.
 */
export function DocsNav({ current }: DocsNavProps) {
  const route = current ? findRoute(current) : undefined

  return (
    <nav
      aria-label="Tint documentation"
      className="mb-8 flex flex-wrap items-center gap-x-2 gap-y-3 text-sm text-tint-muted"
    >
      <a href="#/" className="flex items-center gap-2 font-semibold tracking-tight text-tint-ink">
        <span
          aria-hidden="true"
          className="inline-flex size-6 items-center justify-center rounded-md bg-tint-accent text-xs text-tint-on-accent"
        >
          t
        </span>
        tint
      </a>

      {route ? (
        <>
          <span aria-hidden="true">/</span>
          <span className="text-tint-ink">{route.label}</span>
        </>
      ) : null}

      <span className="ml-auto flex items-center gap-4">
        {route?.sections?.map((section) => (
          <SectionLink key={section.id} section={section} />
        ))}
        <ThemeControls />
      </span>
    </nav>
  )
}

/**
 * A button rather than `<a href="#usage">`: the route lives in the hash, so an
 * in-page anchor would overwrite it and bounce the reader to the landing page.
 * (That bug was live on the Chat page before this component existed.)
 */
function SectionLink({ section }: { section: DocSection }) {
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      className="hidden cursor-pointer transition hover:text-tint-accent sm:inline"
    >
      {section.label}
    </button>
  )
}
