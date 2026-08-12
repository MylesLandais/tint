import { ArrowUp, Paperclip, Square, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { cn } from '../../lib/utils'
import { Icon, Spinner } from '../icon'
import {
  ChatComposerAttachments,
  ChatComposerFooter,
} from './ChatPrimitives'
import { stripBidi } from './sanitize'
import type {
  ChatAttachmentData,
  ChatActionButtonProps,
  ChatComposerInputProps,
  ChatComposerProps,
} from './types'

/**
 * Tallest the textarea grows before it scrolls, in pixels.
 *
 * The class list and the imperative resize below must agree, so both read this
 * one value rather than repeating `max-h-40` and a bare `160`.
 */
const MAX_INPUT_HEIGHT = 160

/** An attachment is sendable once it is no longer in flight and has not failed. */
function isSendable(attachment: ChatAttachmentData) {
  return attachment.status !== 'uploading' && attachment.status !== 'error'
}

export function ChatActionButton({
  label,
  pending = false,
  className,
  children,
  disabled,
  ...props
}: ChatActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-busy={pending || undefined}
      disabled={disabled || pending}
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {pending ? <Spinner /> : children}
    </button>
  )
}

export function ChatComposerInput({
  value,
  onValueChange,
  submitOnEnter = true,
  className,
  onKeyDown,
  ref,
  style,
  ...props
}: ChatComposerInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autosize = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = '0px'
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_INPUT_HEIGHT)}px`
  }, [])

  useLayoutEffect(autosize, [autosize, value])

  // A width change re-wraps the text, so the height measured for the old width
  // is stale — most visibly on a phone rotating from portrait to landscape.
  useEffect(() => {
    window.addEventListener('resize', autosize)
    return () => window.removeEventListener('resize', autosize)
  }, [autosize])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const composing = event.nativeEvent.isComposing || event.keyCode === 229
    if (
      submitOnEnter &&
      event.key === 'Enter' &&
      !event.shiftKey &&
      !composing
    ) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
    onKeyDown?.(event)
  }

  return (
    <textarea
      ref={(node) => {
        textareaRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      value={value}
      rows={1}
      onChange={(event) => onValueChange(event.target.value)}
      onKeyDown={handleKeyDown}
      style={{ maxHeight: MAX_INPUT_HEIGHT, ...style }}
      className={cn(
        'min-h-7 w-full resize-none bg-transparent text-[0.9375rem] leading-6 outline-none placeholder:text-tint-muted',
        className,
      )}
      {...props}
    />
  )
}

export function ChatComposer({
  value,
  attachments = [],
  state = 'idle',
  error,
  placeholder = 'Write a message…',
  submitLabel = 'Send message',
  stopLabel = 'Stop response',
  maxLength,
  submitOnEnter = true,
  accept,
  multiple = true,
  metadata,
  actions,
  inputRef: forwardedInputRef,
  onValueChange,
  onSubmit,
  onStop,
  onAttachmentAdd,
  onAttachmentRemove,
  className,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: ChatComposerProps) {
  const errorId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [dragging, setDragging] = useState(false)
  const wasSubmitting = useRef(false)
  const readOnly = state === 'disabled' || state === 'submitting'
  const streaming = state === 'streaming'
  const sendable = attachments.filter(isSendable)
  const canSubmit =
    Boolean(value.trim() || sendable.length) && !readOnly && !streaming

  // `state="submitting"` used to disable the textarea, and the browser moves
  // focus off a disabled element to `<body>` — dropping a keyboard or screen
  // reader user out of the conversation on every send. It is now read-only, and
  // focus is restored on the way out in case the consumer moved it.
  useEffect(() => {
    if (state === 'submitting') {
      wasSubmitting.current = true
      return
    }
    if (wasSubmitting.current) {
      wasSubmitting.current = false
      if (state === 'idle' && document.activeElement === document.body) {
        inputRef.current?.focus()
      }
    }
  }, [state])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    // In-flight and failed uploads have no usable `url` yet; sending them hands
    // the application an attachment it cannot resolve.
    onSubmit({
      text: value.trim(),
      attachments: sendable,
      metadata,
    })
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length || !onAttachmentAdd) return
    onAttachmentAdd(Array.from(files))
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.target.files)
    event.target.value = ''
  }

  const handleDragOver = (event: DragEvent<HTMLFormElement>) => {
    if (onAttachmentAdd) {
      event.preventDefault()
      setDragging(true)
    }
    onDragOver?.(event)
  }

  const handleDragLeave = (event: DragEvent<HTMLFormElement>) => {
    // `dragleave` also fires when the pointer crosses between children, which
    // would strobe the drop styling. Only clear once it has left the form.
    const next = event.relatedTarget
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      setDragging(false)
    }
    onDragLeave?.(event)
  }

  const handleDrop = (event: DragEvent<HTMLFormElement>) => {
    if (onAttachmentAdd) {
      event.preventDefault()
      setDragging(false)
      addFiles(event.dataTransfer.files)
    }
    onDrop?.(event)
  }

  return (
    // Drag-and-drop lands on the form because the drop target is the whole
    // composer, not one control inside it.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <form
      data-chat-composer=""
      data-state={state}
      onSubmit={submit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative border-t border-tint-border bg-tint-panel/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-4',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'mx-auto max-w-3xl rounded-2xl border border-tint-border bg-tint-panel p-2 shadow-sm transition-[border-color,box-shadow] focus-within:border-tint-accent focus-within:shadow-[0_0_0_3px_var(--tint-accent-soft)]',
          dragging &&
            'border-tint-accent bg-tint-accent-soft',
          state === 'error' && 'border-tint-danger/60',
        )}
      >
        {attachments.length ? (
          <ChatComposerAttachments className="mb-2">
            {attachments.map((attachment) => {
              const preview =
                attachment.mediaType.startsWith('image/')
                  ? attachment.previewUrl ?? attachment.url
                  : undefined
              return (
              <div
                key={attachment.id}
                data-attachment-id={attachment.id}
                className="flex max-w-full items-center gap-2 rounded-lg border border-tint-border bg-tint-surface px-2.5 py-2"
              >
                {attachment.status === 'uploading' ? (
                  <Spinner size="sm" className="shrink-0 text-tint-accent" />
                ) : preview ? (
                  <img
                    src={preview}
                    alt=""
                    className="size-6 shrink-0 rounded object-cover"
                  />
                ) : (
                  <Icon icon={Paperclip} size="sm" className="shrink-0 text-tint-muted" />
                )}
                <span className="max-w-48 truncate text-xs font-medium">
                  {stripBidi(attachment.name)}
                </span>
                {attachment.status === 'uploading' ? (
                  <span className="text-[0.6875rem] text-tint-muted">
                    {attachment.uploadProgress ?? 0}%
                  </span>
                ) : null}
                {/* p-1.5 keeps the hit area at 26px — WCAG 2.2 SC 2.5.8 needs 24. */}
                <button
                  type="button"
                  onClick={() => onAttachmentRemove?.(attachment.id)}
                  aria-label={`Remove ${stripBidi(attachment.name)}`}
                  className="-mr-1 rounded p-1.5 text-tint-muted hover:bg-tint-panel hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-tint-accent"
                >
                  <Icon icon={X} size="sm" />
                </button>
              </div>
              )
            })}
          </ChatComposerAttachments>
        ) : null}

        <div className="px-2 pt-1">
          <ChatComposerInput
            ref={(node) => {
              inputRef.current = node
              if (typeof forwardedInputRef === 'function') forwardedInputRef(node)
              else if (forwardedInputRef) forwardedInputRef.current = node
            }}
            value={value}
            onValueChange={onValueChange}
            submitOnEnter={submitOnEnter && !readOnly}
            placeholder={placeholder}
            maxLength={maxLength}
            readOnly={readOnly}
            aria-disabled={readOnly || undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <ChatComposerFooter className="mt-1">
          <div className="flex items-center gap-1">
            {onAttachmentAdd ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  multiple={multiple}
                  onChange={handleFileChange}
                  className="sr-only"
                  tabIndex={-1}
                />
                <ChatActionButton
                  label="Attach files"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-tint-muted hover:bg-tint-surface hover:text-tint-ink"
                  disabled={readOnly || streaming}
                >
                  <Icon icon={Paperclip} />
                </ChatActionButton>
              </>
            ) : null}
            {actions}
            <span className="hidden text-[0.6875rem] text-tint-muted sm:inline">
              {dragging ? 'Drop files to attach' : 'Shift + Enter for a new line'}
            </span>
          </div>

          {streaming && onStop ? (
            <ChatActionButton
              label={stopLabel}
              onClick={onStop}
              className="bg-tint-ink text-tint-bg hover:bg-tint-muted"
            >
              <Icon icon={Square} size="xs" className="fill-current" />
            </ChatActionButton>
          ) : (
            <ChatActionButton
              type="submit"
              label={submitLabel}
              disabled={!canSubmit}
              pending={state === 'submitting'}
              className="bg-tint-accent text-tint-on-accent hover:bg-tint-accent-hover"
            >
              <Icon icon={ArrowUp} />
            </ChatActionButton>
          )}
        </ChatComposerFooter>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mx-auto mt-2 max-w-3xl px-2 text-xs text-tint-danger-ink">
          {error}
        </p>
      ) : null}
    </form>
  )
}
