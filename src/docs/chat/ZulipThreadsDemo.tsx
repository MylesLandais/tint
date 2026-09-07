import { Hash, MessageSquareText, Search, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  ChatComposer,
  ChatConversation,
  ChatMessageList,
  type ChatMessageData,
  type ChatSubmitPayload,
} from '../../components/chat'
import { Icon } from '../../components/icon'
import { cn } from '../../lib/utils'

type Topic = {
  id: string
  name: string
  unread: number
  messages: readonly ChatMessageData[]
}

type Channel = {
  id: string
  name: string
  description: string
  topics: readonly Topic[]
}

const alex = { id: 'alex', name: 'Alex Chen', kind: 'human' as const, presence: 'online' as const }
const maya = { id: 'maya', name: 'Maya', kind: 'assistant' as const, presence: 'online' as const }
const you = { id: 'you', name: 'You', kind: 'human' as const, presence: 'online' as const }

function textMessage(
  id: string,
  actor: typeof alex | typeof maya | typeof you,
  createdAt: string,
  text: string,
): ChatMessageData {
  return {
    id,
    actor,
    createdAt,
    status: 'complete',
    parts: [{ id: `${id}-text`, type: 'text', text, format: 'markdown' }],
  }
}

const INITIAL_CHANNELS: readonly Channel[] = [
  {
    id: 'general',
    name: 'General',
    description: 'Product coordination and decisions',
    topics: [
      {
        id: 'react-port',
        name: 'React port',
        unread: 0,
        messages: [
          textMessage(
            'react-1',
            alex,
            '2026-08-31T18:04:00Z',
            'The MVP should preserve topic narrows as durable routes instead of flattening every message into one timeline.',
          ),
          textMessage(
            'react-2',
            maya,
            '2026-08-31T18:07:00Z',
            'I mapped the existing Tint chat list and composition buffer. We can keep both controlled while the channel and topic selection stays application-owned.',
          ),
        ],
      },
      {
        id: 'design-language',
        name: 'Design language',
        unread: 2,
        messages: [
          textMessage(
            'design-1',
            alex,
            '2026-08-31T18:14:00Z',
            'Keep the information density and keyboard flow, but express the shell through Tint tokens and focus contracts.',
          ),
        ],
      },
      {
        id: 'keyboard-nav',
        name: 'Keyboard navigation',
        unread: 0,
        messages: [
          textMessage(
            'keyboard-1',
            maya,
            '2026-08-31T18:21:00Z',
            'The transcript already supports roving focus. Channel and topic commands are the next client slice.',
          ),
        ],
      },
    ],
  },
  {
    id: 'backend',
    name: 'Backend',
    description: 'Rust gateway and persistence contracts',
    topics: [
      {
        id: 'gateway-contract',
        name: 'Gateway contract',
        unread: 2,
        messages: [
          textMessage(
            'gateway-1',
            maya,
            '2026-08-31T19:02:00Z',
            'The realtime envelope needs an ordered event cursor, idempotent reducers, and an explicit resync path.',
          ),
          textMessage(
            'gateway-2',
            alex,
            '2026-08-31T19:05:00Z',
            'Agreed. The React client should consume one typed event stream and never infer server ordering from arrival time.',
          ),
        ],
      },
      {
        id: 'seaweedfs-uploads',
        name: 'SeaweedFS uploads',
        unread: 1,
        messages: [
          textMessage(
            'storage-1',
            alex,
            '2026-08-31T19:18:00Z',
            'Postgres authorizes the upload first, then the object adapter writes a tenant-scoped, content-addressed object key.',
          ),
        ],
      },
    ],
  },
  {
    id: 'launch',
    name: 'Launch',
    description: 'Cutover readiness and acceptance gates',
    topics: [
      {
        id: 'mvp-gates',
        name: 'MVP gates',
        unread: 4,
        messages: [
          textMessage(
            'launch-1',
            maya,
            '2026-08-31T19:31:00Z',
            'A passing build is not enough: deep links, unread state, topic send, and narrow switching need browser proof.',
          ),
        ],
      },
    ],
  },
]

function unreadCount(channel: Channel) {
  return channel.topics.reduce((total, topic) => total + topic.unread, 0)
}

export function ZulipThreadsDemo() {
  const [channels, setChannels] = useState(INITIAL_CHANNELS)
  const [selectedChannelId, setSelectedChannelId] = useState('general')
  const [selectedTopicId, setSelectedTopicId] = useState('react-port')
  const [draft, setDraft] = useState('')

  const selectedChannel =
    channels.find((channel) => channel.id === selectedChannelId) ?? channels[0]!
  const selectedTopic =
    selectedChannel.topics.find((topic) => topic.id === selectedTopicId) ??
    selectedChannel.topics[0]!

  const participantCount = useMemo(
    () => new Set(selectedTopic.messages.map((message) => message.actor.id)).size,
    [selectedTopic.messages],
  )

  const openTopic = (channelId: string, topicId: string) => {
    setSelectedChannelId(channelId)
    setSelectedTopicId(topicId)
    setChannels((current) =>
      current.map((channel) =>
        channel.id !== channelId
          ? channel
          : {
              ...channel,
              topics: channel.topics.map((topic) =>
                topic.id === topicId ? { ...topic, unread: 0 } : topic,
              ),
            },
      ),
    )
  }

  const openChannel = (channel: Channel) => {
    const firstTopic = channel.topics[0]
    if (firstTopic) openTopic(channel.id, firstTopic.id)
  }

  const submit = (payload: ChatSubmitPayload) => {
    const id = `local-${selectedChannel.id}-${selectedTopic.id}-${selectedTopic.messages.length}`
    const message = textMessage(id, you, new Date().toISOString(), payload.text)
    setChannels((current) =>
      current.map((channel) =>
        channel.id !== selectedChannel.id
          ? channel
          : {
              ...channel,
              topics: channel.topics.map((topic) =>
                topic.id === selectedTopic.id
                  ? { ...topic, messages: [...topic.messages, message] }
                  : topic,
              ),
            },
      ),
    )
    setDraft('')
  }

  return (
    <section
      aria-label="Zulip threads client demo"
      className="overflow-hidden rounded-2xl border border-tint-border bg-tint-surface shadow-[0_20px_60px_rgba(30,42,58,0.10)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-tint-border bg-tint-panel px-4 py-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-tint-accent uppercase">
            Tint Channels
          </p>
          <p className="text-sm font-medium text-tint-ink">Threads client MVP</p>
        </div>
        <label className="flex h-9 min-w-48 items-center gap-2 rounded-xl border border-tint-border bg-tint-surface px-3 text-sm text-tint-muted">
          <Icon icon={Search} size="sm" />
          <span className="sr-only">Search messages</span>
          <input
            type="search"
            placeholder="Search messages"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-tint-muted"
          />
        </label>
      </header>

      <div className="grid min-h-[38rem] md:grid-cols-[13rem_15rem_minmax(0,1fr)]">
        <nav
          aria-label="Channels"
          className="border-b border-tint-border bg-tint-panel p-3 md:border-r md:border-b-0"
        >
          <p className="mb-2 px-2 text-[0.6875rem] font-semibold tracking-wide text-tint-muted uppercase">
            Channels
          </p>
          <div className="flex gap-1 overflow-x-auto md:flex-col">
            {channels.map((channel) => {
              const unread = unreadCount(channel)
              const selected = channel.id === selectedChannel.id
              return (
                <button
                  key={channel.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  aria-label={`${channel.name}${unread ? `, ${unread} unread` : ''}`}
                  onClick={() => openChannel(channel)}
                  className={cn(
                    'flex min-w-32 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent md:min-w-0',
                    selected
                      ? 'bg-tint-accent-soft font-semibold text-tint-accent'
                      : 'text-tint-muted hover:bg-tint-surface hover:text-tint-ink',
                  )}
                >
                  <Icon icon={Hash} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{channel.name}</span>
                  {unread ? (
                    <span className="rounded-full bg-tint-accent px-1.5 text-[0.65rem] font-semibold text-tint-on-accent">
                      {unread}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </nav>

        <nav
          aria-label={`${selectedChannel.name} topics`}
          className="border-b border-tint-border bg-tint-surface p-3 md:border-r md:border-b-0"
        >
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-tint-ink">{selectedChannel.name}</p>
            <p className="text-xs leading-5 text-tint-muted">{selectedChannel.description}</p>
          </div>
          <p className="mb-2 px-2 text-[0.6875rem] font-semibold tracking-wide text-tint-muted uppercase">
            Topics
          </p>
          <div className="flex gap-1 overflow-x-auto md:flex-col">
            {selectedChannel.topics.map((topic) => {
              const selected = topic.id === selectedTopic.id
              return (
                <button
                  key={topic.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  aria-label={`${topic.name}${topic.unread ? `, ${topic.unread} unread` : ''}`}
                  onClick={() => openTopic(selectedChannel.id, topic.id)}
                  className={cn(
                    'flex min-w-40 items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent md:min-w-0',
                    selected
                      ? 'bg-tint-panel font-semibold text-tint-ink shadow-sm'
                      : 'text-tint-muted hover:bg-tint-panel hover:text-tint-ink',
                  )}
                >
                  <Icon icon={MessageSquareText} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{topic.name}</span>
                  {topic.unread ? (
                    <span className="text-xs font-semibold text-tint-accent">{topic.unread}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </nav>

        <ChatConversation label={`${selectedChannel.name}, ${selectedTopic.name}`} className="min-h-[38rem]">
          <div className="flex items-center justify-between gap-3 border-b border-tint-border bg-tint-panel px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-tint-muted">{selectedChannel.name}</p>
              <h3 className="truncate text-base font-semibold text-tint-ink">{selectedTopic.name}</h3>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-tint-muted">
              <Icon icon={Users} size="sm" /> {participantCount} participants
            </span>
          </div>
          <ChatMessageList
            messages={selectedTopic.messages}
            currentActorId="you"
            label={`${selectedTopic.name} messages`}
            className="min-h-0 flex-1"
          />
          <div className="border-t border-tint-border bg-tint-panel px-4 py-2 text-xs text-tint-muted">
            Posting to <strong className="font-semibold text-tint-ink">{selectedChannel.name} › {selectedTopic.name}</strong>
          </div>
          <ChatComposer
            aria-label="Compose message"
            value={draft}
            onValueChange={setDraft}
            onSubmit={submit}
            placeholder={`Message ${selectedTopic.name}`}
            inputLabel={`Message ${selectedTopic.name}`}
            submitLabel={`Send to ${selectedTopic.name}`}
          />
        </ChatConversation>
      </div>
    </section>
  )
}
