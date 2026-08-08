import { ArrowDown, CalendarDays, MessageCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Icon, Spinner } from '../icon'
import type {
  ChatComposerSlotProps,
  ChatMessageSlotProps,
} from './types'

export function ChatEmptyState({
  className,
  children,
  ...props
}: ChatMessageSlotProps) {
  return (
    <section
      data-chat-empty-state=""
      className={cn(
        'm-auto flex max-w-sm flex-col items-center gap-3 px-6 py-12 text-center text-sm text-tint-muted',
        className,
      )}
      {...props}
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-tint-accent-soft text-tint-accent">
        <Icon icon={MessageCircle} size="lg" />
      </span>
      {children ?? 'Start a conversation'}
    </section>
  )
}

export function ChatDateDivider({
  className,
  children,
  ...props
}: ChatMessageSlotProps) {
  return (
    <div
      role="separator"
      data-chat-date-divider=""
      className={cn(
        'flex items-center gap-3 py-3 text-xs font-medium text-tint-muted',
        className,
      )}
      {...props}
    >
      <span className="h-px flex-1 bg-tint-border" />
      <Icon icon={CalendarDays} size="sm" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-tint-border" />
    </div>
  )
}

export function ChatTypingIndicator({
  className,
  children = 'Assistant is responding',
  ...props
}: ChatMessageSlotProps) {
  return (
    <div
      role="status"
      data-chat-typing-indicator=""
      className={cn(
        'flex items-center gap-2 py-2 text-xs text-tint-muted',
        className,
      )}
      {...props}
    >
      <Spinner size="sm" />
      <span>{children}</span>
    </div>
  )
}

export function ChatScrollToBottom({
  className,
  children = 'New messages',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      data-chat-scroll-to-bottom=""
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-tint-border bg-tint-panel px-3 py-2 text-xs font-medium shadow-lg transition hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
        className,
      )}
      {...props}
    >
      <Icon icon={ArrowDown} size="sm" />
      {children}
    </button>
  )
}

export function ChatMessageContent({
  className,
  ...props
}: ChatMessageSlotProps) {
  return (
    <div
      data-chat-message-content=""
      className={cn('min-w-0 space-y-3', className)}
      {...props}
    />
  )
}

export function ChatMessageActions({
  className,
  ...props
}: ChatMessageSlotProps) {
  return (
    <div
      data-chat-message-actions=""
      className={cn('flex items-center gap-1', className)}
      {...props}
    />
  )
}

export function ChatComposerAttachments({
  className,
  ...props
}: ChatComposerSlotProps) {
  return (
    <div
      data-chat-composer-attachments=""
      className={cn('flex flex-wrap gap-2', className)}
      {...props}
    />
  )
}

export function ChatComposerFooter({
  className,
  ...props
}: ChatComposerSlotProps) {
  return (
    <div
      data-chat-composer-footer=""
      className={cn('flex items-center justify-between gap-3', className)}
      {...props}
    />
  )
}
