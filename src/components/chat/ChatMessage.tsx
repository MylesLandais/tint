import { Bot, Check, Copy, RotateCcw, Square, User, Volume2 } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import { Icon, Spinner } from '../icon'
import { ChatMessageActions, ChatMessageContent } from './ChatPrimitives'
import { ChatMessagePartView } from './ChatParts'
import { useChatPlayback } from './ChatPlaybackContext'
import { stripBidi } from './sanitize'
import { useCopied } from '../../lib/useCopied'
import type {
  ChatCustomPart,
  ChatMessageData,
  ChatMessageProps,
  ChatTimestamp,
} from './types'

function formatTimestamp(timestamp: ChatTimestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

/**
 * The text a reader means when they press Copy.
 *
 * Reasoning parts are deliberately excluded: they are the model's working, not
 * its answer, and folding them in silently puts chain-of-thought on the
 * clipboard of someone who asked for the reply.
 */
function textContent<TCustomPart extends ChatCustomPart>(
  message: ChatMessageData<TCustomPart>,
) {
  return message.parts
    .flatMap((part) => {
      if (part.type === 'text') return [part.text]
      if (part.type === 'code') return [part.code]
      return []
    })
    .join('\n\n')
}

function hasAudioPart<TCustomPart extends ChatCustomPart>(
  message: ChatMessageData<TCustomPart>,
) {
  return message.parts.some((part) => part.type === 'audio')
}

function ChatMessageImpl<TCustomPart extends ChatCustomPart = never>({
  message,
  alignment = 'start',
  groupPosition = 'solo',
  showActor = true,
  showAvatar = true,
  renderPart,
  onAction,
  onToolApproval,
  onRenderError,
  enableSpeak = false,
  speakingMessageId,
  className,
  ...props
}: ChatMessageProps<TCustomPart>) {
  const isCurrentActor = alignment === 'end'
  const timestamp = useMemo(() => formatTimestamp(message.createdAt), [message.createdAt])
  const copyText = useMemo(() => textContent(message), [message])
  const { copied, copy } = useCopied(copyText)
  const actorName = stripBidi(message.actor.name)
  const busy = message.status === 'streaming' || message.status === 'sending'
  const canRetry = message.status === 'error' || message.status === 'stopped'
  const playback = useChatPlayback()
  const speakingId = speakingMessageId ?? playback?.speakingMessageId ?? null
  const isSpeaking = speakingId === message.id
  const hasAudio = hasAudioPart(message)
  const [hasSpoken, setHasSpoken] = useState(false)
  const canSpeak =
    enableSpeak &&
    !busy &&
    (hasAudio || copyText.trim().length > 0)
  const showReplay = hasAudio || isSpeaking || hasSpoken

  // A recoverable error part renders its own contextual Retry. Showing the
  // message-level one as well gives two controls that emit an identical payload.
  // Only applies to the built-in renderer — a custom `renderPart` may draw no
  // retry affordance at all, so the footer stays the only way back.
  const hasInlineRetry =
    !renderPart &&
    message.parts.some((part) => part.type === 'error' && part.recoverable)

  const retry = useCallback(() => {
    onAction?.({ messageId: message.id, action: 'retry' })
  }, [onAction, message.id])

  const copyMessage = () => {
    void copy()
    onAction?.({ messageId: message.id, action: 'copy' })
  }

  const speak = useCallback(() => {
    setHasSpoken(true)
    playback?.requestSpeak(message.id)
    onAction?.({ messageId: message.id, action: 'speak' })
  }, [onAction, playback, message.id])

  return (
    <article
      aria-label={`${actorName}, ${timestamp || 'message'}`}
      aria-busy={busy || undefined}
      data-chat-message=""
      data-message-id={message.id}
      data-status={message.status}
      data-alignment={alignment}
      data-group-position={groupPosition}
      data-speaking={isSpeaking ? '' : undefined}
      className={cn(
        'group/message flex min-w-0 gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-tint-accent focus-visible:ring-offset-4',
        alignment === 'end' && 'flex-row-reverse',
        alignment === 'center' && 'justify-center',
        className,
      )}
      {...props}
    >
      {showAvatar && alignment !== 'center' ? (
        <span
          className={cn(
            'mt-0.5 grid size-8 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-semibold',
            isCurrentActor
              ? 'bg-tint-accent text-tint-on-accent'
              : 'border border-tint-border bg-tint-panel text-tint-accent',
          )}
          aria-hidden="true"
        >
          {message.actor.avatarUrl ? (
            <img
              src={message.actor.avatarUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : message.actor.kind === 'assistant' ? (
            <Icon icon={Bot} />
          ) : message.actor.kind === 'human' ? (
            <Icon icon={User} />
          ) : (
            actorName.slice(0, 1).toUpperCase()
          )}
        </span>
      ) : !showAvatar && alignment !== 'center' ? (
        <span className="size-8 shrink-0" aria-hidden="true" />
      ) : null}

      <div
        className={cn(
          'min-w-0',
          alignment === 'end' ? 'max-w-[min(82%,42rem)]' : 'max-w-[min(92%,48rem)] flex-1',
          alignment === 'center' && 'max-w-xl text-center',
        )}
      >
        {showActor ? (
          <header
            className={cn(
              'mb-1.5 flex items-center gap-2 text-xs',
              alignment === 'end' && 'justify-end',
            )}
          >
            <span className="font-medium">{actorName}</span>
            {timestamp ? (
              <time
                dateTime={new Date(message.createdAt).toISOString()}
                className="text-tint-muted"
              >
                {timestamp}
              </time>
            ) : null}
          </header>
        ) : null}

        <div
          className={cn(
            alignment === 'end'
              ? 'rounded-2xl rounded-tr-md bg-tint-accent px-4 py-3 text-tint-on-accent'
              : alignment === 'center'
                ? 'rounded-xl border border-tint-border bg-tint-panel px-4 py-3'
                : 'py-1',
          )}
        >
          <ChatMessageContent>
            {message.parts.map((part) => (
              <ChatMessagePartView
                key={part.id}
                part={part}
                message={message}
                renderPart={renderPart}
                onAction={onAction}
                onToolApproval={onToolApproval}
                onRetry={retry}
                onRenderError={onRenderError}
              />
            ))}
          </ChatMessageContent>

          {message.parts.length === 0 && message.status === 'streaming' ? (
            <div className="flex items-center gap-2 py-1 text-sm text-tint-muted">
              <Spinner />
              Thinking…
            </div>
          ) : null}
        </div>

        <footer
          className={cn(
            'mt-1.5 flex min-h-7 items-center gap-2',
            alignment === 'end' && 'justify-end',
          )}
        >
          {message.status === 'streaming' ? (
            <span
              role="status"
              className="flex items-center gap-1.5 text-xs text-tint-muted"
            >
              <Spinner size="xs" />
              Responding
            </span>
          ) : null}
          {message.status === 'stopped' ? (
            <span className="flex items-center gap-1.5 text-xs text-tint-muted">
              <Icon icon={Square} size="xs" className="fill-current" />
              Stopped
            </span>
          ) : null}

          <ChatMessageActions
            className={cn(
              'transition-opacity sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100',
              message.status === 'streaming' && 'ml-auto',
            )}
          >
            {canSpeak ? (
              <button
                type="button"
                onClick={speak}
                aria-pressed={isSpeaking || undefined}
                aria-label={
                  showReplay ? `Replay ${actorName}` : `Play ${actorName}`
                }
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-tint-muted hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
              >
                <Icon icon={Volume2} size="sm" />
                {showReplay ? 'Replay' : 'Play'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={copyMessage}
              className="inline-flex items-center gap-1 rounded-md p-1.5 text-xs text-tint-muted hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
              aria-label={copied ? 'Message copied' : 'Copy message'}
            >
              {copied ? <Icon icon={Check} size="sm" /> : <Icon icon={Copy} size="sm" />}
            </button>
            {canRetry && !hasInlineRetry ? (
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-tint-muted hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
              >
                <Icon icon={RotateCcw} size="sm" />
                Retry
              </button>
            ) : null}
          </ChatMessageActions>
        </footer>
      </div>
    </article>
  )
}

/**
 * Memoized so one streaming token re-renders the message it belongs to rather
 * than the whole transcript. The cast restores the generic signature `memo`
 * erases; it does not change runtime behavior.
 */
export const ChatMessage = memo(ChatMessageImpl) as typeof ChatMessageImpl
