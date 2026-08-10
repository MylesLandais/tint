import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Search } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'

export type SettingsPopoutItem = {
  /** Stable id. What `value` matches and `onSelect` reports. */
  id: string
  /** Visible text. Also searched. */
  label: string
  /** Collects the item under a heading. Groups keep first-seen order. */
  group?: string
  /** Shown right-aligned as a `<kbd>`. Presentational — tint binds nothing. */
  shortcut?: string
  /** Not rendered, but searched, so an item can be found by what it does. */
  description?: string
}

export type SettingsPopoutProps = {
  /** Whether the popout is visible. */
  isOpen: boolean
  /**
   * Called when the popout should close — Escape, an outside click, or a
   * selection. Escape and selection also restore focus to the trigger.
   */
  onOpenChange: (isOpen: boolean) => void
  /** Selectable entries, optionally grouped. */
  items: readonly SettingsPopoutItem[]
  /** Currently selected id. Highlighted on open and marked with a check. */
  value?: string
  /** Called with the chosen id. The popout closes itself afterwards. */
  onSelect?: (id: string) => void
  /** Accessible name for the dialog and its listbox. */
  label?: string
  /** Search input placeholder. */
  placeholder?: string
  /** Replaces the default keyboard hints. */
  footer?: ReactNode
  /** Shown when the query matches nothing. */
  emptySearchText?: ReactNode
  /**
   * Extra classes for the panel. It is positioned absolutely against the
   * nearest positioned ancestor, so it and its trigger need a `relative` parent.
   */
  className?: string
}

type GroupedItems = {
  heading?: string
  items: SettingsPopoutItem[]
}

function groupItems(items: readonly SettingsPopoutItem[]): GroupedItems[] {
  const order: string[] = []
  const groups = new Map<string, SettingsPopoutItem[]>()
  const ungrouped: SettingsPopoutItem[] = []

  for (const item of items) {
    if (!item.group) {
      ungrouped.push(item)
      continue
    }
    if (!groups.has(item.group)) {
      order.push(item.group)
      groups.set(item.group, [])
    }
    groups.get(item.group)!.push(item)
  }

  return [
    ...order.map((heading) => ({ heading, items: groups.get(heading)! })),
    ...(ungrouped.length ? [{ items: ungrouped }] : []),
  ]
}

function filterItems(items: readonly SettingsPopoutItem[], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return items
  return items.filter((item) => {
    const haystack = `${item.label} ${item.group ?? ''} ${item.description ?? ''}`.toLowerCase()
    return haystack.includes(normalized)
  })
}

export function SettingsPopout({
  isOpen,
  onOpenChange,
  items,
  value,
  onSelect,
  label = 'Settings',
  placeholder = 'Search settings…',
  footer,
  emptySearchText = 'No results',
  className,
}: SettingsPopoutProps) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = useMemo(() => filterItems(items, query), [items, query])
  const grouped = useMemo(() => groupItems(filtered), [filtered])
  const flat = useMemo(() => grouped.flatMap((group) => group.items), [grouped])

  /** Close and hand focus back to whatever opened the popout. */
  const close = useCallback(() => {
    onOpenChange(false)
    triggerRef.current?.focus()
  }, [onOpenChange])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setActiveIndex(0)
      return
    }

    // Off `flat`, not `items`: grouping reorders the list, so the raw `items`
    // index pointed at whatever happened to sit at that position after
    // regrouping — highlighting one row on open and selecting a different one
    // on Enter.
    const selectedIndex = flat.findIndex((item) => item.id === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)

    // Remember where focus came from so Escape or a selection can hand it back
    // instead of dropping the reader on <body>.
    triggerRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
    // `flat` is deliberately absent: this positions the highlight at open time,
    // and re-running it as the reader types would drag the highlight back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, value])

  useEffect(() => {
    if (!isOpen) return

    // An outside click moves focus on its own, so this closes without the
    // focus restore `close()` performs — yanking focus back to the trigger
    // would fight whatever the reader just clicked.
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onOpenChange, close])

  useEffect(() => {
    if (activeIndex > flat.length - 1) {
      setActiveIndex(Math.max(flat.length - 1, 0))
    }
  }, [activeIndex, flat.length])

  const selectItem = (id: string) => {
    onSelect?.(id)
    close()
  }

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (flat.length ? (index + 1) % flat.length : 0))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) =>
        flat.length ? (index - 1 + flat.length) % flat.length : 0,
      )
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setActiveIndex(0)
    }
    if (event.key === 'End') {
      event.preventDefault()
      setActiveIndex(Math.max(flat.length - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const item = flat[activeIndex]
      if (item) selectItem(item.id)
    }
  }

  const itemIndexById = useMemo(() => {
    const map = new Map<string, number>()
    flat.forEach((item, index) => map.set(item.id, index))
    return map
  }, [flat])

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          // Deliberately not `aria-modal`. Nothing here traps focus or inerts the
          // page, and claiming otherwise tells a screen reader the rest of the
          // document is unavailable while Tab walks straight out of the popout.
          // It is a non-modal popover: Escape closes it and focus returns to the
          // trigger.
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'absolute right-0 bottom-[calc(100%+0.5rem)] z-30 w-72 overflow-hidden rounded-xl border border-tint-chrome-border bg-tint-chrome text-tint-chrome-ink shadow-[0_16px_48px_var(--tint-shadow-color)] backdrop-blur-xl sm:w-80',
            className,
          )}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b border-tint-chrome-border px-3 py-2.5">
            <Icon icon={Search} className="shrink-0 text-tint-chrome-ink/55" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onInputKeyDown}
              placeholder={placeholder}
              // The full combobox pattern. It already carried `aria-controls`,
              // `aria-autocomplete`, and `aria-activedescendant`, but without
              // the role a screen reader treats it as a plain text field and
              // never announces the option the arrow keys are moving over.
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                flat[activeIndex] ? `${listId}-${flat[activeIndex].id}` : undefined
              }
              className="w-full bg-transparent text-sm text-tint-chrome-ink outline-none placeholder:text-tint-chrome-ink/40"
            />
          </div>

          <div
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-64 overflow-y-auto p-1.5"
          >
            {flat.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-tint-chrome-ink/55">
                {emptySearchText}
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.heading ?? 'ungrouped'} className="mb-1 last:mb-0">
                  {group.heading ? (
                    <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-[0.08em] text-tint-chrome-ink/45 uppercase">
                      {group.heading}
                    </div>
                  ) : null}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const index = itemIndexById.get(item.id) ?? 0
                      const isActive = index === activeIndex
                      const isSelected = item.id === value

                      return (
                        <button
                          key={item.id}
                          id={`${listId}-${item.id}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                            isActive ? 'bg-tint-chrome-ink/12' : 'hover:bg-tint-chrome-ink/8',
                            isSelected && 'font-medium',
                          )}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectItem(item.id)}
                        >
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.shortcut ? (
                            <kbd className="rounded-md bg-tint-chrome-ink/10 px-1.5 py-0.5 font-mono text-[11px] text-tint-chrome-ink/60">
                              {item.shortcut}
                            </kbd>
                          ) : null}
                          {isSelected ? (
                            <Icon icon={Check} className="shrink-0 text-tint-chrome-ink" />
                          ) : (
                            <span className="size-4 shrink-0" aria-hidden="true" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-tint-chrome-border px-3 py-2 text-[11px] text-tint-chrome-ink/45">
            {footer ?? (
              <>
                <span>
                  <kbd className="rounded bg-tint-chrome-ink/10 px-1 py-0.5">↑</kbd>{' '}
                  <kbd className="rounded bg-tint-chrome-ink/10 px-1 py-0.5">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="rounded bg-tint-chrome-ink/10 px-1 py-0.5">↵</kbd> select
                  <span className="mx-2 text-tint-chrome-ink/25">·</span>
                  <kbd className="rounded bg-tint-chrome-ink/10 px-1 py-0.5">esc</kbd> close
                </span>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default SettingsPopout
