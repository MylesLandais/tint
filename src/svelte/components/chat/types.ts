import type { Snippet } from 'svelte'
import type { HTMLButtonAttributes, HTMLFormAttributes, HTMLAttributes, HTMLTextareaAttributes } from 'svelte/elements'
import type {
  ChatAttachmentData, ChatBuiltInMessagePart, ChatComposerState, ChatCustomPart, ChatId,
  ChatImageItem, ChatMessageActionPayload, ChatMessageAlignment, ChatMessageData,
  ChatMessageGroupPosition, ChatMessagePart, ChatSubmitPayload, ChatToolApprovalPayload,
  ChatPreferenceOption,
} from '../../../core/chat/types'

export type * from '../../../core/chat/types'

export type ChatPartRenderContext<TCustomPart extends ChatCustomPart = never> = {
  message: ChatMessageData<TCustomPart>
  isStreaming: boolean
  onAction?: (payload: ChatMessageActionPayload) => void
  onToolApproval?: (payload: ChatToolApprovalPayload) => void
}

/** Return a Svelte snippet, or nothing to use the built-in renderer. */
export type ChatPartRenderer<TCustomPart extends ChatCustomPart = never> = (
  part: ChatMessagePart<TCustomPart>, context: ChatPartRenderContext<TCustomPart>,
) => Snippet | null | undefined

export type ChatMessageAlternativesProps = {
  alternatives: readonly { id: string; label?: string }[]
  value: string
  onValueChange: (id: string) => void
  onRegenerate?: () => void
  disabled?: boolean
  label?: string
  class?: string
}

export type ChatMessageEditorProps = {
  value: string
  onValueChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  busy?: boolean
  error?: string
  label?: string
  maxLength?: number
  class?: string
}

export type ChatConversationProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  label?: string
  density?: 'compact' | 'comfortable' | 'spacious'
  children?: Snippet
}

export type ChatMessageListProps<TCustomPart extends ChatCustomPart = never> = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  messages: readonly ChatMessageData<TCustomPart>[]
  currentActorId?: ChatId
  label?: string
  loading?: boolean
  hasEarlier?: boolean
  followOutput?: boolean
  enableRovingFocus?: boolean
  emptyState?: Snippet
  renderPart?: ChatPartRenderer<TCustomPart>
  renderMessageFooter?: (message: ChatMessageData<TCustomPart>) => Snippet | null | undefined
  viewportRef?: (node: HTMLDivElement | null) => void
  onFollowOutputChange?: (following: boolean) => void
  onLoadEarlier?: () => void
  onMessageAction?: (payload: ChatMessageActionPayload) => void
  onToolApproval?: (payload: ChatToolApprovalPayload) => void
  enableSpeak?: boolean
  speakingMessageId?: ChatId | null
  onSpeakingMessageIdChange?: (messageId: ChatId | null) => void
  onRenderError?: (error: Error) => void
  className?: string
}

export type ChatMessageProps<TCustomPart extends ChatCustomPart = never> = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  message: ChatMessageData<TCustomPart>
  replyToMessage?: ChatMessageData<TCustomPart>
  alignment?: ChatMessageAlignment
  groupPosition?: ChatMessageGroupPosition
  showActor?: boolean
  showAvatar?: boolean
  renderPart?: ChatPartRenderer<TCustomPart>
  renderMessageFooter?: (message: ChatMessageData<TCustomPart>) => Snippet | null | undefined
  onAction?: (payload: ChatMessageActionPayload) => void
  onToolApproval?: (payload: ChatToolApprovalPayload) => void
  enableSpeak?: boolean
  speakingMessageId?: ChatId | null
  speakGeneration?: number
  onSpeak?: (messageId: ChatId) => void
  onClearSpeak?: (messageId: ChatId) => void
  onRenderError?: (error: Error) => void
  className?: string
}

export type ChatComposerProps = Omit<HTMLFormAttributes, 'children' | 'onsubmit'> & {
  value: string
  attachments?: readonly ChatAttachmentData[]
  state?: ChatComposerState
  error?: string
  placeholder?: string
  inputLabel?: string
  submitLabel?: string
  submitDisabled?: boolean
  submitDisabledReason?: string
  stopLabel?: string
  maxLength?: number
  submitOnEnter?: boolean
  accept?: string
  multiple?: boolean
  metadata?: Readonly<Record<string, unknown>>
  actions?: Snippet
  inputRef?: (node: HTMLTextAreaElement | null) => void
  onInputKeydown?: (event: KeyboardEvent) => void
  inputListboxId?: string
  inputActiveOptionId?: string
  onValueChange: (value: string) => void
  onSubmit: (payload: ChatSubmitPayload) => void
  onStop?: () => void
  onAttachmentAdd?: (files: readonly File[]) => void
  onAttachmentRemove?: (attachmentId: ChatId) => void
  className?: string
}

export type ChatComposerInputProps = Omit<HTMLTextareaAttributes, 'value' | 'oninput'> & {
  value: string
  onValueChange: (value: string) => void
  submitOnEnter?: boolean
  inputRef?: (node: HTMLTextAreaElement | null) => void
  onInputKeydown?: (event: KeyboardEvent) => void
}

export type ChatActionButtonProps = HTMLButtonAttributes & {
  label: string
  pending?: boolean
  children?: Snippet
}

export type ChatSlotProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & { children?: Snippet; className?: string }

export type ChatRichPartProps<TPart extends ChatBuiltInMessagePart> = Omit<HTMLAttributes<HTMLElement>, 'children' | 'part'> & {
  part: TPart
  className?: string
  messageId?: ChatId
  onAction?: (payload: ChatMessageActionPayload) => void
  onDecision?: (approved: boolean, reason?: string) => void
  onRetry?: () => void
}

export type ChatPreferenceProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  title?: string
  subtitle?: string
  options: readonly ChatPreferenceOption[]
  selectedOptionId?: ChatId
  status?: 'pending' | 'selected'
  onSelect?: (optionId: ChatId) => void
  className?: string
}

export type ChatMediaLightboxProps = {
  open: boolean
  images: readonly ChatImageItem[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
  caption?: string
  class?: string
  className?: string
}
