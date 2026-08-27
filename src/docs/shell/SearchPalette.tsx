import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { DOC_ROUTES, hrefFor, type DocRoute, type DocSection } from '../routes'
import { Icon } from '../../components/icon'
import { cn } from '../../lib/utils'

type SearchResult = {
  route: DocRoute
  /** Present when the match targets a section within the page. */
  section?: DocSection
}

/** Flat, searchable index: every page plus every registered section. */
const INDEX: SearchResult[] = DOC_ROUTES.flatMap((route) => [
  { route },
  ...(route.sections ?? []).map((section) => ({ route, section })),
])

function matches(result: SearchResult, tokens: string[]) {
  const haystack = result.section
    ? `${result.route.label} ${result.section.label}`.toLowerCase()
    : `${result.route.label} ${result.route.blurb}`.toLowerCase()
  return tokens.every((token) => haystack.includes(token))
}

export type SearchPaletteProps = {
  open: boolean
  onClose: () => void
}

/**
 * ⌘K command palette over the docs index. Selecting a section result navigates
 * to its page first, then scrolls the section into view — lazy pages may need a
 * second attempt once their chunk has mounted.
 */
export function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return INDEX.filter((result) => !result.section).slice(0, 12)
    return INDEX.filter((result) => matches(result, tokens)).slice(0, 12)
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
      // Autofocus after the overlay has painted.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => setActiveIndex(0), [query])

  // Window-level keys while open: arrows cycle, Enter selects, Escape closes.
  // Attached imperatively so the dialog markup stays free of non-interactive
  // handlers; select logic is inlined to keep the dep list honest.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((index) => (index + 1) % Math.max(results.length, 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((index) => (index - 1 + results.length) % Math.max(results.length, 1))
      } else if (event.key === 'Enter') {
        const result = results[activeIndex]
        if (!result) return
        onClose()
        window.location.hash = hrefFor(result.route)
        if (result.section) {
          const id = result.section.id
          window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 100)
          window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 500)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, results, activeIndex, onClose])

  if (!open) return null

  const select = (result: SearchResult) => {
    onClose()
    window.location.hash = hrefFor(result.route)
    if (result.section) {
      const id = result.section.id
      // Lazy pages mount asynchronously; retry once the chunk has landed.
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 100)
      window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 500)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]">
      <div className="absolute inset-0 bg-tint-ink/30" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Search documentation"
        className="relative w-full max-w-lg overflow-hidden rounded-xl border border-tint-border bg-tint-panel shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-tint-border px-4 py-3">
          <span className="text-tint-muted">
            <Icon icon={Search} size="sm" />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search components…"
            className="w-full bg-transparent text-sm text-tint-ink outline-none placeholder:text-tint-muted"
          />
          <kbd className="rounded-full bg-tint-surface px-1.5 py-0.5 text-xs font-semibold text-tint-muted">
            esc
          </kbd>
        </div>
        <ul className="m-0 max-h-80 list-none overflow-y-auto p-2">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-tint-muted">No matches.</li>
          ) : (
            results.map((result, index) => (
              <li key={result.section ? `${result.route.path}#${result.section.id}` : result.route.path}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => select(result)}
                  className={cn(
                    'flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors',
                    index === activeIndex ? 'bg-tint-accent-soft' : '',
                  )}
                >
                  <span className="text-sm font-medium text-tint-ink">
                    {result.section ? `${result.route.label} — ${result.section.label}` : result.route.label}
                  </span>
                  {!result.section ? (
                    <span className="line-clamp-1 text-xs text-tint-muted">{result.route.blurb}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
