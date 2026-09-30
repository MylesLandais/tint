import { stripBidi } from './sanitize'
import type {
  ChatAttachmentData, ChatCustomPart, ChatId, ChatMessageData, ChatMessageGroupPosition,
  ChatSubmitPayload, ChatTimestamp,
} from './types'

export function isSendableAttachment(attachment: ChatAttachmentData): boolean {
  return attachment.status !== 'uploading' && attachment.status !== 'error'
}

export function chatSubmitPayload(
  value: string,
  attachments: readonly ChatAttachmentData[],
  metadata?: Readonly<Record<string, unknown>>,
): ChatSubmitPayload | null {
  const sendable = attachments.filter(isSendableAttachment)
  const text = value.trim()
  if (!text && sendable.length === 0) return null
  return { text, attachments: sendable, metadata }
}

/** Only answer text and code go on the clipboard; reasoning stays separate. */
export function chatMessageText<TCustomPart extends ChatCustomPart>(message: ChatMessageData<TCustomPart>): string {
  return message.parts.flatMap((part) => part.type === 'text' ? [part.text] : part.type === 'code' ? [part.code] : []).join('\n\n')
}

export function chatGroupPositions<TCustomPart extends ChatCustomPart>(messages: readonly ChatMessageData<TCustomPart>[]): ChatMessageGroupPosition[] {
  return messages.map((current, index) => {
    const before = messages[index - 1]?.actor.id === current.actor.id
    const after = messages[index + 1]?.actor.id === current.actor.id
    if (before && after) return 'middle'
    if (before) return 'last'
    if (after) return 'first'
    return 'solo'
  })
}

export function chatStatusAnnouncement<TCustomPart extends ChatCustomPart>(messages: readonly ChatMessageData<TCustomPart>[], currentActorId?: ChatId): string {
  const message = messages.at(-1)
  if (!message || message.actor.id === currentActorId || message.actor.kind === 'human') return ''
  const name = stripBidi(message.actor.name)
  if (message.status === 'streaming') return `${name} is responding`
  if (message.status === 'complete') return `${name} finished responding`
  if (message.status === 'error') return `${name}'s response failed`
  if (message.status === 'stopped') return `${name}'s response was stopped`
  return ''
}

export function chatTimestamp(timestamp: ChatTimestamp): { label: string; dateTime?: string } {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  if (Number.isNaN(date.getTime())) return { label: '' }
  return {
    label: new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date),
    dateTime: date.toISOString(),
  }
}

export function chatJsonPreview(value: unknown, maxLength = 8_000): { text: string; truncated: boolean; total: number } {
  let serialized: string
  try { serialized = JSON.stringify(value, null, 2) ?? String(value) }
  catch { return { text: 'Unable to display this value.', truncated: false, total: 0 } }
  return serialized.length > maxLength
    ? { text: serialized.slice(0, maxLength), truncated: true, total: serialized.length }
    : { text: serialized, truncated: false, total: serialized.length }
}

export function chatReadableSize(size?: number): string | undefined {
  if (size === undefined) return undefined
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
