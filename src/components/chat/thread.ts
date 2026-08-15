import type {
  ChatCustomPart,
  ChatId,
  ChatMessageData,
  ChatTimestamp,
} from './types'

/**
 * A channel of chat content — the unit a mock server (or a real one) hands to
 * the client. Messages are stored flat and linked by
 * `ChatMessageData.parentMessageId`; the tree is derived, never stored. This
 * mirrors the HN/Lobsters/Reddit listing model and keeps inserts and rethreads
 * cheap.
 */
export type ChatChannelData<TCustomPart extends ChatCustomPart = never> = {
  id: ChatId
  name: string
  /** Channel topic line, as in Zulip/forum headers. */
  topic?: string
  messages: readonly ChatMessageData<TCustomPart>[]
}

/** A message with its direct replies, nested Reddit-style. */
export type ChatThreadNode<TCustomPart extends ChatCustomPart = never> = {
  message: ChatMessageData<TCustomPart>
  replies: ChatThreadNode<TCustomPart>[]
}

export type ChatThreadSummary = {
  rootMessageId: ChatId
  /** All descendants, not just direct replies. */
  replyCount: number
  lastReplyAt?: ChatTimestamp
  participantIds: readonly ChatId[]
}

function compareTimestamps(a: ChatTimestamp, b: ChatTimestamp) {
  return new Date(a).getTime() - new Date(b).getTime()
}

/**
 * parentMessageId → direct replies, in chronological order. Messages whose
 * parent is missing from the set (e.g. history not yet loaded) are keyed under
 * their `parentMessageId` like any other reply; callers that walk from roots
 * simply never reach them.
 */
export function buildThreadIndex<TCustomPart extends ChatCustomPart>(
  messages: readonly ChatMessageData<TCustomPart>[],
): Map<ChatId, ChatMessageData<TCustomPart>[]> {
  const index = new Map<ChatId, ChatMessageData<TCustomPart>[]>()
  for (const message of messages) {
    if (message.parentMessageId == null) continue
    const siblings = index.get(message.parentMessageId)
    if (siblings) siblings.push(message)
    else index.set(message.parentMessageId, [message])
  }
  for (const replies of index.values()) {
    replies.sort((a, b) => compareTimestamps(a.createdAt, b.createdAt))
  }
  return index
}

/**
 * Nested thread tree rooted at each parentless message, in input order.
 * A cycle in `parentMessageId` links (corrupt data) is cut rather than
 * followed forever; the repeated message is simply not revisited.
 */
export function buildThreadTree<TCustomPart extends ChatCustomPart>(
  messages: readonly ChatMessageData<TCustomPart>[],
): ChatThreadNode<TCustomPart>[] {
  const index = buildThreadIndex(messages)
  const build = (
    message: ChatMessageData<TCustomPart>,
    seen: Set<ChatId>,
  ): ChatThreadNode<TCustomPart> => {
    seen.add(message.id)
    const replies = (index.get(message.id) ?? [])
      .filter((reply) => !seen.has(reply.id))
      .map((reply) => build(reply, seen))
    seen.delete(message.id)
    return { message, replies }
  }
  return messages
    .filter((message) => message.parentMessageId == null)
    .map((message) => build(message, new Set()))
}

/** Aggregate stats for a "N replies" affordance under a thread root. */
export function threadSummary<TCustomPart extends ChatCustomPart>(
  messages: readonly ChatMessageData<TCustomPart>[],
  rootMessageId: ChatId,
): ChatThreadSummary {
  const index = buildThreadIndex(messages)
  let replyCount = 0
  let lastReplyAt: ChatTimestamp | undefined
  const participantIds = new Set<ChatId>()
  const queue = [...(index.get(rootMessageId) ?? [])]
  while (queue.length > 0) {
    const reply = queue.pop() as ChatMessageData<TCustomPart>
    replyCount += 1
    participantIds.add(reply.actor.id)
    if (lastReplyAt === undefined || compareTimestamps(lastReplyAt, reply.createdAt) < 0) {
      lastReplyAt = reply.createdAt
    }
    queue.push(...(index.get(reply.id) ?? []))
  }
  return {
    rootMessageId,
    replyCount,
    lastReplyAt,
    participantIds: [...participantIds],
  }
}

/**
 * The topmost message of the thread `message` belongs to — the message itself
 * when it is not a reply. Returns undefined when a parent link dangles.
 */
export function threadRoot<TCustomPart extends ChatCustomPart>(
  messages: readonly ChatMessageData<TCustomPart>[],
  message: ChatMessageData<TCustomPart>,
): ChatMessageData<TCustomPart> | undefined {
  const byId = new Map(messages.map((m) => [m.id, m]))
  let current: ChatMessageData<TCustomPart> | undefined = message
  const seen = new Set<ChatId>()
  while (current?.parentMessageId != null) {
    if (seen.has(current.id)) return undefined
    seen.add(current.id)
    current = byId.get(current.parentMessageId)
  }
  return current
}

/**
 * One-line plain-text preview of a message, for quoted-reply headers and
 * "replying to" banners. Text and code parts only, like Copy.
 */
export function replySnippet<TCustomPart extends ChatCustomPart>(
  message: ChatMessageData<TCustomPart>,
  maxLength = 80,
): string {
  const text = message.parts
    .flatMap((part) => {
      if (part.type === 'text') return [part.text]
      if (part.type === 'code') return [part.code]
      return []
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trimEnd()}…`
}
