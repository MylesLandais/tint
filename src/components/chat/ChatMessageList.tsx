import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type UIEvent,
} from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/icon'
import { ChatMessage } from './ChatMessage'
import { ChatEmptyState, ChatScrollToBottom } from './ChatPrimitives'
import { stripBidi } from './sanitize'
import type {
  ChatCustomPart,
  ChatId,
  ChatMessageData,
  ChatMessageGroupPosition,
  ChatMessageListProps,
} from './types'

const FOLLOW_THRESHOLD = 72

const INTERACTIVE = 'button, a, textarea, input, summary, audio'

/**
 * Where each message sits in its run of consecutive messages from one actor.
 * Computed once per render for the whole list — the alignment, avatar, and
 * header decisions all read the same answer.
 */
function groupPositions<TCustomPart extends ChatCustomPart>(
  messages: readonly ChatMessageData<TCustomPart>[],
): ChatMessageGroupPosition[] {
  return messages.map((current, index) => {
    const sameBefore = messages[index - 1]?.actor.id === current.actor.id
    const sameAfter = messages[index + 1]?.actor.id === current.actor.id
    if (sameBefore && sameAfter) return 'middle'
    if (sameBefore) return 'last'
    if (sameAfter) return 'first'
    return 'solo'
  })
}

/**
 * A one-line summary for the status region.
 *
 * The reader's own messages are skipped: they know what they just sent, and
 * "you finished responding" is noise on every turn.
 */
function statusAnnouncement<TCustomPart extends ChatCustomPart>(
  messages: readonly ChatMessageData<TCustomPart>[],
  currentActorId?: ChatId,
) {
  const message = messages.at(-1)
  if (!message) return ''
  if (message.actor.id === currentActorId || message.actor.kind === 'human') return ''

  const name = stripBidi(message.actor.name)
  if (message.status === 'streaming') return `${name} is responding`
  if (message.status === 'complete') return `${name} finished responding`
  if (message.status === 'error') return `${name}'s response failed`
  if (message.status === 'stopped') return `${name}'s response was stopped`
  return ''
}

export function ChatMessageList<TCustomPart extends ChatCustomPart = never>({
  messages,
  currentActorId,
  label = 'Messages',
  loading = false,
  hasEarlier = false,
  followOutput,
  enableRovingFocus = true,
  emptyState,
  renderPart,
  onFollowOutputChange,
  onLoadEarlier,
  onMessageAction,
  onToolApproval,
  onRenderError,
  className,
  onScroll,
  onKeyDown,
  onFocus,
  ref,
  ...props
}: ChatMessageListProps<TCustomPart>) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousLayout = useRef({
    firstId: messages[0]?.id,
    scrollHeight: 0,
  })
  const [internalFollowing, setInternalFollowing] = useState(true)
  const [activeIndex, setActiveIndex] = useState(Math.max(messages.length - 1, 0))
  const [hasUnseen, setHasUnseen] = useState(false)
  const seenLastId = useRef(messages.at(-1)?.id)
  // Until the reader moves the tab stop themselves, it tracks the newest message
  // so tabbing in lands on what just arrived rather than wherever the tail
  // happened to be when the list mounted.
  const tabStopMoved = useRef(false)
  const following = followOutput ?? internalFollowing
  const announcement = useMemo(
    () => statusAnnouncement(messages, currentActorId),
    [messages, currentActorId],
  )
  const positions = useMemo(() => groupPositions(messages), [messages])
  const isEmpty = messages.length === 0

  const setFollowing = useCallback(
    (next: boolean) => {
      if (followOutput === undefined) setInternalFollowing(next)
      onFollowOutputChange?.(next)
    },
    [followOutput, onFollowOutputChange],
  )

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const viewport = viewportRef.current
      if (!viewport) return
      viewport.scrollTo({ top: viewport.scrollHeight, behavior })
      setFollowing(true)
    },
    [setFollowing],
  )

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const firstId = messages[0]?.id
    const previous = previousLayout.current
    const prepended =
      previous.firstId !== undefined &&
      firstId !== previous.firstId &&
      messages.some((message) => message.id === previous.firstId)

    if (prepended) {
      viewport.scrollTop += viewport.scrollHeight - previous.scrollHeight
    } else if (following) {
      viewport.scrollTop = viewport.scrollHeight
    }

    previousLayout.current = {
      firstId,
      scrollHeight: viewport.scrollHeight,
    }
  }, [following, messages])

  // Content grows without the message array changing: an image finishes loading,
  // a disclosure opens, markdown settles. Without this the newest text drifts
  // below the fold while the list still believes it is pinned to the bottom.
  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      if (!following) return
      viewport.scrollTop = viewport.scrollHeight
      previousLayout.current.scrollHeight = viewport.scrollHeight
    })
    observer.observe(content)
    return () => observer.disconnect()
    // Keyed on emptiness, not on `messages`: the content element only exists once
    // there is something to show, so the observer must re-attach across that
    // transition — but not on every arriving message.
  }, [following, isEmpty])

  useLayoutEffect(() => {
    const last = Math.max(messages.length - 1, 0)
    setActiveIndex((index) => (tabStopMoved.current ? Math.min(index, last) : last))
  }, [messages.length])

  // The affordance only claims "New messages" when something actually arrived
  // while the reader was scrolled away; otherwise it just offers a way back.
  useEffect(() => {
    const lastId = messages.at(-1)?.id
    if (following) {
      seenLastId.current = lastId
      setHasUnseen(false)
    } else if (lastId !== seenLastId.current) {
      setHasUnseen(true)
    }
  }, [following, messages])

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget
    const nearBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <=
      FOLLOW_THRESHOLD
    if (nearBottom !== following) setFollowing(nearBottom)
    previousLayout.current.scrollHeight = viewport.scrollHeight
    onScroll?.(event)
  }

  const focusMessage = (index: number) => {
    const viewport = viewportRef.current
    const items = viewport?.querySelectorAll<HTMLElement>('[data-chat-message]')
    if (!items?.length) return
    const next = Math.max(0, Math.min(index, items.length - 1))
    tabStopMoved.current = true
    setActiveIndex(next)
    items[next]?.focus()
  }

  // One delegated handler instead of a closure per message — a fresh `onFocus`
  // on every render would make memoizing `ChatMessage` pointless.
  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const messageElement = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-chat-message]',
    )
    if (messageElement) {
      const items = viewportRef.current?.querySelectorAll<HTMLElement>(
        '[data-chat-message]',
      )
      const index = items ? Array.prototype.indexOf.call(items, messageElement) : -1
      if (index >= 0) {
        tabStopMoved.current = true
        setActiveIndex(index)
      }
    }
    onFocus?.(event)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (enableRovingFocus) {
      const messageElement = (event.target as HTMLElement).closest<HTMLElement>(
        '[data-chat-message]',
      )
      const interactive = (event.target as HTMLElement).closest(INTERACTIVE)

      if (messageElement && !interactive) {
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          focusMessage(activeIndex + 1)
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          focusMessage(activeIndex - 1)
        } else if (event.key === 'Home') {
          event.preventDefault()
          focusMessage(0)
        } else if (event.key === 'End') {
          event.preventDefault()
          focusMessage(messages.length - 1)
        } else if (event.key === 'Enter') {
          const target = messageElement.querySelector<HTMLElement>(INTERACTIVE)
          if (target) {
            event.preventDefault()
            target.focus()
          }
        }
      } else if (interactive && event.key === 'Escape' && messageElement) {
        event.preventDefault()
        messageElement.focus()
      }
    }

    onKeyDown?.(event)
  }

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={(node) => {
          viewportRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        role="log"
        aria-label={label}
        // Deliberately silent. `role="log"` implies `polite`, which would read
        // every streamed token aloud; the curated status region at the bottom of
        // this component announces turn boundaries instead.
        aria-live="off"
        data-chat-message-list=""
        data-following={following}
        className={cn(
          'h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6',
          className,
        )}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        {...props}
      >
        {hasEarlier ? (
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={onLoadEarlier}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-tint-border bg-tint-panel px-3 py-1.5 text-xs font-medium text-tint-muted hover:bg-tint-surface disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            >
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Loading…' : 'Load earlier messages'}
            </button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          emptyState ?? <ChatEmptyState />
        ) : (
          <div
            ref={contentRef}
            className="mx-auto flex w-full max-w-3xl flex-col gap-5"
          >
            {messages.map((message, index) => {
              const position = positions[index] ?? 'solo'
              const startsGroup = position === 'solo' || position === 'first'

              return (
                <ChatMessage
                  key={message.id}
                  message={message}
                  alignment={
                    message.actor.id === currentActorId
                      ? 'end'
                      : message.actor.kind === 'system'
                        ? 'center'
                        : 'start'
                  }
                  groupPosition={position}
                  showActor={startsGroup}
                  showAvatar={startsGroup}
                  tabIndex={
                    enableRovingFocus ? (index === activeIndex ? 0 : -1) : undefined
                  }
                  renderPart={renderPart}
                  onAction={onMessageAction}
                  onToolApproval={onToolApproval}
                  onRenderError={onRenderError}
                />
              )
            })}
          </div>
        )}
      </div>

      {!following ? (
        <div className="pointer-events-none absolute right-0 bottom-4 left-0 flex justify-center">
          <ChatScrollToBottom
            className="pointer-events-auto"
            onClick={() => scrollToBottom()}
          >
            {hasUnseen ? 'New messages' : 'Jump to latest'}
          </ChatScrollToBottom>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
    </div>
  )
}
