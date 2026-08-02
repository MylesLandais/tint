import {
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
import { cn } from '@/lib/utils'

export type SettingsPopoutItem = {
  id: string
  label: string
  group?: string
  shortcut?: string
  description?: string
}

export type SettingsPopoutProps = {
  /** Whether the popout is visible */
  isOpen: boolean
  /** Called when open state should change */
  onOpenChange: (isOpen: boolean) => void
  /** Selectable settings items */
  items: SettingsPopoutItem[]
  /** Currently selected item id (picker mode) */
  value?: string
  /** Called when an item is chosen */
  onSelect?: (id: string) => void
  /** Accessible label for the dialog */
  label?: string
  /** Search input placeholder */
  placeholder?: string
  /** Optional footer content; defaults to keyboard hints */
  footer?: ReactNode
  /** Empty search results text */
  emptySearchText?: ReactNode
  /** Additional class names for the panel */
  className?: string
}

type GroupedItems = {
  heading?: string
  items: SettingsPopoutItem[]
}

function groupItems(items: SettingsPopoutItem[]): GroupedItems[] {
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

function filterItems(items: SettingsPopoutItem[], query: string) {
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
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const filtered = useMemo(() => filterItems(items, query), [items, query])
  const grouped = useMemo(() => groupItems(filtered), [filtered])
  const flat = useMemo(() => grouped.flatMap((group) => group.items), [grouped])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setActiveIndex(0)
      return
    }

    const selectedIndex = items.findIndex((item) => item.id === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [isOpen, value, items])

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        onOpenChange(false)
      }
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onOpenChange])

  useEffect(() => {
    if (activeIndex > flat.length - 1) {
      setActiveIndex(Math.max(flat.length - 1, 0))
    }
  }, [activeIndex, flat.length])

  const selectItem = (id: string) => {
    onSelect?.(id)
    onOpenChange(false)
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
          aria-modal="true"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn(
            'absolute right-0 bottom-[calc(100%+0.5rem)] z-30 w-[min(100%,20rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#14161ccc] text-white shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl',
            className,
          )}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <Search className="size-4 shrink-0 text-white/55" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onInputKeyDown}
              placeholder={placeholder}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={
                flat[activeIndex] ? `${listId}-${flat[activeIndex].id}` : undefined
              }
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
            />
          </div>

          <div
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-64 overflow-y-auto p-1.5"
          >
            {flat.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-white/55">
                {emptySearchText}
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.heading ?? 'ungrouped'} className="mb-1 last:mb-0">
                  {group.heading ? (
                    <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-[0.08em] text-white/45 uppercase">
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
                            'flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition-colors',
                            isActive ? 'bg-white/12' : 'hover:bg-white/8',
                            isSelected && 'font-medium',
                          )}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectItem(item.id)}
                        >
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.shortcut ? (
                            <kbd className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/60">
                              {item.shortcut}
                            </kbd>
                          ) : null}
                          {isSelected ? (
                            <Check className="size-4 shrink-0 text-white" aria-hidden="true" />
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

          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-3 py-2 text-[11px] text-white/45">
            {footer ?? (
              <>
                <span>
                  <kbd className="rounded bg-white/10 px-1 py-0.5">↑</kbd>{' '}
                  <kbd className="rounded bg-white/10 px-1 py-0.5">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="rounded bg-white/10 px-1 py-0.5">↵</kbd> select
                  <span className="mx-2 text-white/25">·</span>
                  <kbd className="rounded bg-white/10 px-1 py-0.5">esc</kbd> close
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
