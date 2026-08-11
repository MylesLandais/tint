import type {
  ButtonHTMLAttributes,
  ErrorInfo,
  FormHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  Ref,
  TextareaHTMLAttributes,
} from 'react'

/** Opaque application identifier. Stability matters: it keys React reconciliation. */
export type ChatId = string

/** Any value `new Date()` accepts. Invalid values render without a timestamp. */
export type ChatTimestamp = string | number | Date

/** Who produced a message. Drives avatar, alignment, and announcement behavior. */
export type ChatActorKind = 'human' | 'assistant' | 'system' | 'tool'

/** Availability of a human actor. Presentation only; Tint never derives it. */
export type ChatPresence = 'online' | 'away' | 'busy' | 'offline' | 'unknown'

export type ChatActor = {
  id: ChatId
  /** Display name. Bidi control characters are stripped before rendering. */
  name: string
  kind: ChatActorKind
  /** Rendered as a decorative avatar with an empty `alt`. */
  avatarUrl?: string
  description?: string
  presence?: ChatPresence
}

/**
 * Lifecycle of a whole message.
 *
 * `sending` and `streaming` mark the message `aria-busy`; `error` and `stopped`
 * are the two states that offer Retry.
 */
export type ChatMessageStatus =
  | 'queued'
  | 'sending'
  | 'streaming'
  | 'complete'
  | 'stopped'
  | 'error'

/** Lifecycle of a single part within a message. */
export type ChatPartStatus = 'pending' | 'streaming' | 'complete' | 'error'

export type ChatAttachmentData = {
  id: ChatId
  /** Bidi control characters are stripped before rendering. */
  name: string
  /** MIME type. A leading `image/` selects the image icon. */
  mediaType: string
  /** Bytes. Formatted as B/KB/MB. */
  size?: number
  url?: string
  previewUrl?: string
  /** 0–100, shown while `status` is `uploading`. */
  uploadProgress?: number
  /**
   * `uploading` and `error` attachments are excluded from the composer's submit
   * payload — they have no resolvable `url` yet.
   */
  status?: 'pending' | 'uploading' | 'ready' | 'error'
  error?: string
}

export type ChatSourceData = {
  id: ChatId
  /** Bidi control characters are stripped before rendering. */
  title: string
  /** Only `http:`, `https:`, `mailto:`, and same-document URLs become links. */
  url?: string
  description?: string
  citation?: string
  iconUrl?: string
}

/**
 * Lifecycle of a tool call. An unrecognized value renders as itself rather than
 * failing — this data usually arrives over a network where the union is not
 * enforced.
 */
export type ChatToolStatus =
  | 'pending'
  | 'running'
  | 'approval-required'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export type ChatToolData = {
  id: ChatId
  /** Machine name, used when `title` is absent. */
  name: string
  /** Human-facing name. */
  title?: string
  status: ChatToolStatus
  /** Serialized as JSON in the disclosure. Large payloads are truncated. */
  input?: unknown
  /** Serialized as JSON in the disclosure. Large payloads are truncated. */
  output?: unknown
  /** One-line description shown in the collapsed header. */
  summary?: string
  error?: string
  startedAt?: ChatTimestamp
  finishedAt?: ChatTimestamp
}

export type ChatApprovalData = {
  id: ChatId
  /** The tool this decision gates, when there is one. */
  toolId?: ChatId
  title: string
  /** What approving actually does. Worth filling in — this is a consent prompt. */
  description?: string
  /** Only `pending` renders the Approve/Deny controls. */
  status: 'pending' | 'approved' | 'denied'
  approveLabel?: string
  denyLabel?: string
  /** Show an optional free-text note alongside the decision. */
  allowReason?: boolean
}

export type ChatPartBase = {
  /** Stable within its message; keys the part's React element. */
  id: ChatId
  status?: ChatPartStatus
}

export type ChatTextPart = ChatPartBase & {
  type: 'text'
  text: string
  /** `markdown` renders sanitized GFM with raw HTML disabled. Defaults to plain. */
  format?: 'plain' | 'markdown'
}

export type ChatCodePart = ChatPartBase & {
  type: 'code'
  code: string
  /**
   * Selects the syntax highlighter, and shown in the header when `filename` is
   * absent. An unrecognised value renders as plain text rather than failing.
   */
  language?: string
  filename?: string
}

export type ChatImagePart = ChatPartBase & {
  type: 'image'
  src: string
  /** Required. Pass `''` only for genuinely decorative images. */
  alt: string
  width?: number
  height?: number
}

export type ChatFilePart = ChatPartBase & {
  type: 'file'
  attachment: ChatAttachmentData
}

export type ChatAudioPart = ChatPartBase & {
  type: 'audio'
  src: string
  /** Optional visible track or recording title. */
  title?: string
  /** Optional artist, speaker, or source. */
  artist?: string
  /** Optional square artwork URL. */
  artwork?: string
  /** Keep empty when the artwork only repeats the track metadata. */
  artworkAlt?: string
  /** Seconds. Rendered as `m:ss`. */
  duration?: number
  /** Text fallback, shown in a disclosure below the player. */
  transcript?: string
  /** Amplitude samples drawn as decorative static bars. Any scale; normalized. */
  waveform?: readonly number[]
}

export type ChatSourcesPart = ChatPartBase & {
  type: 'sources'
  sources: readonly ChatSourceData[]
}

export type ChatReasoningPart = ChatPartBase & {
  type: 'reasoning'
  text: string
  /** Defaults to `Thinking` while streaming, `Reasoning` once settled. */
  title?: string
  /** Milliseconds, shown as `N.Ns` in the header. */
  durationMs?: number
  /** Initial open state only. Streaming never force-opens the disclosure. */
  defaultExpanded?: boolean
}

export type ChatToolPart = ChatPartBase & {
  type: 'tool'
  tool: ChatToolData
}

export type ChatApprovalPart = ChatPartBase & {
  type: 'approval'
  approval: ChatApprovalData
}

export type ChatArtifactPart = ChatPartBase & {
  type: 'artifact'
  /** Application-defined discriminator, shown under the title. */
  kind: string
  title: string
  /** Serialized as JSON by the built-in renderer; override via `renderPart`. */
  data: unknown
  description?: string
}

export type ChatErrorPart = ChatPartBase & {
  type: 'error'
  message: string
  code?: string
  /** Renders an inline Retry, which replaces the message-level one. */
  recoverable?: boolean
}

/**
 * Escape hatch for application-specific content. Supply a `renderPart` to draw
 * it; without one, the payload is shown as JSON.
 */
export type ChatCustomPart = ChatPartBase & {
  type: 'custom'
  kind: string
  data: unknown
}

export type ChatBuiltInMessagePart =
  | ChatTextPart
  | ChatCodePart
  | ChatImagePart
  | ChatFilePart
  | ChatAudioPart
  | ChatSourcesPart
  | ChatReasoningPart
  | ChatToolPart
  | ChatApprovalPart
  | ChatArtifactPart
  | ChatErrorPart

/** One selectable column inside a preference comparison shell. */
export type ChatPreferenceOption = {
  id: ChatId
  label: string
  /** Ordinary built-in parts — the shell does not invent new content types. */
  parts: readonly ChatBuiltInMessagePart[]
}

/**
 * Layout payload for a side-by-side response preference UI.
 * Typically carried on a `type: "custom"` part with `kind: "preference"`.
 */
export type ChatPreferenceData = {
  title?: string
  subtitle?: string
  status: 'pending' | 'selected'
  selectedOptionId?: ChatId
  options: readonly [ChatPreferenceOption, ChatPreferenceOption]
}

export type ChatMessagePart<TCustomPart extends ChatCustomPart = never> =
  | ChatBuiltInMessagePart
  | TCustomPart

export type ChatMessageData<TCustomPart extends ChatCustomPart = never> = {
  id: ChatId
  actor: ChatActor
  createdAt: ChatTimestamp
  /** Rendered in order. Replace only the changed part while streaming. */
  parts: readonly ChatMessagePart<TCustomPart>[]
  status: ChatMessageStatus
  conversationId?: ChatId
  updatedAt?: ChatTimestamp
  parentMessageId?: ChatId
  /** Application data. Tint passes it through untouched. */
  metadata?: Readonly<Record<string, unknown>>
  error?: string
}

/** Position within a run of consecutive messages from the same actor. */
export type ChatMessageGroupPosition = 'solo' | 'first' | 'middle' | 'last'

/** `end` is the current actor, `center` is a system notice, `start` is everyone else. */
export type ChatMessageAlignment = 'start' | 'end' | 'center'

export type ChatMessageAction =
  | 'copy'
  | 'retry'
  | 'edit'
  | 'delete'
  | 'reply'
  | 'feedback-up'
  | 'feedback-down'
  | 'custom'

export type ChatMessageActionPayload = {
  messageId: ChatId
  action: ChatMessageAction
  /** Disambiguates when `action` is `custom`. */
  actionId?: string
}

export type ChatToolApprovalPayload = {
  messageId: ChatId
  partId: ChatId
  approvalId: ChatId
  approved: boolean
  /** Present only when the approval set `allowReason` and the reader typed one. */
  reason?: string
}

export type ChatSubmitPayload = {
  /** Already trimmed. */
  text: string
  /** In-flight and failed uploads are excluded. */
  attachments: readonly ChatAttachmentData[]
  /** Whatever was passed to the composer's `metadata` prop. */
  metadata?: Readonly<Record<string, unknown>>
}

/**
 * Composer state, owned by the application.
 *
 * `submitting` and `disabled` make the input read-only rather than disabled, so
 * focus stays in the composer across a send.
 */
export type ChatComposerState =
  | 'idle'
  | 'submitting'
  | 'streaming'
  | 'disabled'
  | 'error'

export type ChatPartRenderContext<TCustomPart extends ChatCustomPart = never> = {
  message: ChatMessageData<TCustomPart>
  isStreaming: boolean
  onAction?: (payload: ChatMessageActionPayload) => void
  onToolApproval?: (payload: ChatToolApprovalPayload) => void
}

/**
 * Draw a part yourself. Return `undefined` or `null` to fall through to the
 * built-in renderer. Keep the reference stable — an inline function re-renders
 * every message on every keystroke.
 */
export type ChatPartRenderer<TCustomPart extends ChatCustomPart = never> = (
  part: ChatMessagePart<TCustomPart>,
  context: ChatPartRenderContext<TCustomPart>,
) => ReactNode

export type ChatConversationProps = HTMLAttributes<HTMLElement> & {
  /** Accessible name for the conversation region. */
  label?: string
  /** Spacing between the transcript and the composer. */
  density?: 'compact' | 'comfortable' | 'spacious'
}

export type ChatMessageListProps<TCustomPart extends ChatCustomPart = never> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  messages: readonly ChatMessageData<TCustomPart>[]
  /** Messages from this actor align to the end and are not announced. */
  currentActorId?: ChatId
  /** Accessible name for the transcript. */
  label?: string
  /** Shows a busy state on the "load earlier" control. */
  loading?: boolean
  /** Whether older history exists. Reveals the "load earlier" control. */
  hasEarlier?: boolean
  /**
   * Controls stick-to-bottom. Omit to let the list manage it from scroll
   * position; supply it and you must respond to `onFollowOutputChange`.
   */
  followOutput?: boolean
  /** Arrow/Home/End navigation with a single tab stop. Default `true`. */
  enableRovingFocus?: boolean
  /** Replaces the default empty state. */
  emptyState?: ReactNode
  renderPart?: ChatPartRenderer<TCustomPart>
  /** Access to the scroll viewport. */
  ref?: Ref<HTMLDivElement>
  onFollowOutputChange?: (following: boolean) => void
  onLoadEarlier?: () => void
  onMessageAction?: (payload: ChatMessageActionPayload) => void
  onToolApproval?: (payload: ChatToolApprovalPayload) => void
  /**
   * A part threw while rendering. The part is replaced with a notice either way;
   * without this handler the error is logged to the console.
   */
  onRenderError?: (error: Error, info: ErrorInfo) => void
}

export type ChatMessageProps<TCustomPart extends ChatCustomPart = never> = Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> & {
  message: ChatMessageData<TCustomPart>
  /** Defaults to `start`. `ChatMessageList` derives this from `currentActorId`. */
  alignment?: ChatMessageAlignment
  groupPosition?: ChatMessageGroupPosition
  /** Show the actor name and timestamp header. */
  showActor?: boolean
  /** Show the avatar. When false a spacer keeps grouped messages aligned. */
  showAvatar?: boolean
  renderPart?: ChatPartRenderer<TCustomPart>
  onAction?: (payload: ChatMessageActionPayload) => void
  onToolApproval?: (payload: ChatToolApprovalPayload) => void
  /** See `ChatMessageListProps.onRenderError`. */
  onRenderError?: (error: Error, info: ErrorInfo) => void
}

export type ChatMessageSlotProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode
}

export type ChatComposerProps = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  /** The draft. Fully controlled. */
  value: string
  attachments?: readonly ChatAttachmentData[]
  state?: ChatComposerState
  /** Announced once and associated with the input. */
  error?: string
  placeholder?: string
  /** Accessible name for the send button. */
  submitLabel?: string
  /** Accessible name for the stop button, shown while `state` is `streaming`. */
  stopLabel?: string
  maxLength?: number
  /** Enter submits, Shift+Enter inserts a newline. Never fires mid-IME. */
  submitOnEnter?: boolean
  /** `accept` for the file picker. */
  accept?: string
  /** Allow selecting several files at once. Default `true`. */
  multiple?: boolean
  /** Passed through to `ChatSubmitPayload.metadata`. */
  metadata?: Readonly<Record<string, unknown>>
  /** Access to the textarea, for focusing it after a send. */
  inputRef?: Ref<HTMLTextAreaElement>
  /** Extra controls rendered after attachments in the footer's left cluster. */
  actions?: ReactNode
  onValueChange: (value: string) => void
  onSubmit: (payload: ChatSubmitPayload) => void
  /** Supplying this swaps the send button for Stop while streaming. */
  onStop?: () => void
  /** Supplying this enables the attach button and drag-and-drop. */
  onAttachmentAdd?: (files: readonly File[]) => void
  onAttachmentRemove?: (attachmentId: ChatId) => void
}

export type ChatComposerInputProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange'
> & {
  value: string
  onValueChange: (value: string) => void
  /** Enter submits the containing form. Never fires mid-IME composition. */
  submitOnEnter?: boolean
  ref?: Ref<HTMLTextAreaElement>
}

export type ChatComposerSlotProps = HTMLAttributes<HTMLElement> & {
  children?: ReactNode
}

export type ChatActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Accessible name. These buttons are icon-only. */
  label: string
  /** Swaps the icon for a spinner, sets `aria-busy`, and disables the button. */
  pending?: boolean
}

export type ChatRichPartProps<TPart extends ChatBuiltInMessagePart> =
  Omit<HTMLAttributes<HTMLElement>, 'part'> & {
    part: TPart
  }
