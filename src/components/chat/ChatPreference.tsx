import { CheckCircle2 } from 'lucide-react'
import { useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'
import { ChatBuiltInPart } from './ChatParts'
import { stripBidi } from './sanitize'
import type { ChatId, ChatPreferenceOption } from './types'

const NESTED_CONTROL = 'button, a, input, textarea, select, [role="button"]'

export type ChatPreferenceProps = Omit<HTMLAttributes<HTMLElement>, 'onSelect'> & {
  title?: string
  subtitle?: string
  options: readonly ChatPreferenceOption[]
  selectedOptionId?: ChatId
  status?: 'pending' | 'selected'
  onSelect?: (optionId: ChatId) => void
}

/**
 * Layout shell that splits the chat column into selectable response cards.
 * Nested bodies are ordinary built-in parts rendered via `ChatBuiltInPart`.
 *
 * Cards use `role="radio"` on a non-button element so nested part controls
 * (for example code Copy) stay valid interactive descendants.
 */
export function ChatPreference({
  title = 'Which response do you prefer?',
  subtitle = 'Your choice helps compare answer quality.',
  options,
  selectedOptionId,
  status = 'pending',
  onSelect,
  className,
  ...props
}: ChatPreferenceProps) {
  const locked = status === 'selected'
  const selectedIndex = options.findIndex((option) => option.id === selectedOptionId)
  const [focusIndex, setFocusIndex] = useState(() => (selectedIndex >= 0 ? selectedIndex : 0))

  const choose = (optionId: ChatId) => {
    if (!locked) onSelect?.(optionId)
  }

  const moveFocus = (from: number, delta: number, currentTarget: HTMLDivElement) => {
    if (options.length === 0) return
    const next = (from + delta + options.length) % options.length
    setFocusIndex(next)
    const radios = currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')
    radios?.[next]?.focus()
  }

  const onOptionClick = (
    event: MouseEvent<HTMLDivElement>,
    optionId: ChatId,
    index: number,
  ) => {
    // Nested part controls (code Copy, links) must not count as a preference pick.
    if ((event.target as HTMLElement).closest(NESTED_CONTROL)) return
    setFocusIndex(index)
    choose(optionId)
  }

  const onOptionKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    optionId: ChatId,
    index: number,
  ) => {
    if (locked) return
    if (event.target !== event.currentTarget) return
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      choose(optionId)
      return
    }
    const delta =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0
    if (!delta) return
    event.preventDefault()
    moveFocus(index, delta, event.currentTarget)
  }

  return (
    <section
      data-chat-part="preference"
      data-status={status}
      className={cn('space-y-3', className)}
      {...props}
    >
      <header className="text-center">
        <h4 className="text-sm font-semibold text-tint-ink">{title}</h4>
        {subtitle ? (
          <p className="mt-1 text-xs text-tint-muted">{subtitle}</p>
        ) : null}
      </header>

      <div
        role="radiogroup"
        aria-label={title}
        aria-disabled={locked || undefined}
        className="grid gap-3 sm:grid-cols-2"
      >
        {options.map((option, index) => {
          const selected = selectedOptionId === option.id
          const tabStop = selectedIndex >= 0 ? selected : index === focusIndex
          return (
            <div
              key={option.id}
              role="radio"
              aria-checked={selected}
              aria-disabled={locked || undefined}
              tabIndex={locked ? -1 : tabStop ? 0 : -1}
              onClick={(event) => onOptionClick(event, option.id, index)}
              onKeyDown={(event) => onOptionKeyDown(event, option.id, index)}
              onFocus={() => setFocusIndex(index)}
              className={cn(
                'min-w-0 rounded-xl border bg-tint-panel p-3 text-left transition',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
                selected
                  ? 'border-tint-accent shadow-[0_0_0_1px_var(--tint-accent)]'
                  : 'border-tint-border hover:border-tint-accent/45 hover:bg-tint-surface',
                locked && !selected && 'opacity-70',
                !locked && 'cursor-pointer',
              )}
            >
              <div className="mb-3 flex items-center gap-2 border-b border-tint-border pb-2">
                <span
                  className={cn(
                    'grid size-6 shrink-0 place-items-center rounded-full text-[0.6875rem] font-semibold',
                    selected
                      ? 'bg-tint-accent text-tint-on-accent'
                      : 'bg-tint-accent-soft text-tint-accent',
                  )}
                  aria-hidden="true"
                >
                  {selected ? (
                    <Icon icon={CheckCircle2} size="sm" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                  {stripBidi(option.label)}
                </span>
              </div>

              <div className="space-y-3">
                {option.parts.map((part) => (
                  <ChatBuiltInPart key={part.id} part={part} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {locked && selectedOptionId ? (
        <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-tint-muted">
          <Icon icon={CheckCircle2} size="sm" className="text-tint-success" />
          Preference recorded
        </p>
      ) : null}
    </section>
  )
}
