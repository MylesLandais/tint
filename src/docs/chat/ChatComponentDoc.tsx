import {
  Accessibility,
  BookOpen,
  Boxes,
  Code2,
  FlaskConical,
} from 'lucide-react'
import { CodeBlock } from '../components/CodeBlock'
import { PropsTable } from '../components/PropsTable'
import { ThemeControls } from '../components/ThemeControls'
import { ChatDemo } from './demo/ChatDemo'

const usageCode = `import {
  ChatComposer,
  ChatConversation,
  ChatMessageList,
  type ChatMessageData,
  type ChatSubmitPayload,
} from 'tint/chat'
import { useState } from 'react'

export function Assistant() {
  const [messages, setMessages] = useState<readonly ChatMessageData[]>([])
  const [draft, setDraft] = useState('')

  function submit(payload: ChatSubmitPayload) {
    // Reduce the intent into your application state.
    // Tint does not choose a store, transport, or AI SDK.
    setDraft('')
  }

  return (
    <ChatConversation className="h-[42rem]">
      <ChatMessageList
        messages={messages}
        currentActorId="current-user"
      />
      <ChatComposer
        value={draft}
        onValueChange={setDraft}
        onSubmit={submit}
      />
    </ChatConversation>
  )
}`

const richMessageCode = `const message = {
  id: 'assistant-1',
  actor: { id: 'assistant', name: 'Tint', kind: 'assistant' },
  createdAt: new Date(),
  status: 'streaming',
  parts: [
    {
      id: 'reasoning-1',
      type: 'reasoning',
      status: 'complete',
      title: 'Checked the component contract',
      text: 'Messages preserve ordered rich content.',
    },
    {
      id: 'answer-1',
      type: 'text',
      format: 'markdown',
      status: 'streaming',
      text: 'A **controlled** response can grow over time.',
    },
  ],
} satisfies ChatMessageData`

const messageListProps = [
  {
    name: 'messages',
    type: 'readonly ChatMessageData[]',
    required: true,
    description: 'Ordered controlled message data rendered by the transcript.',
  },
  {
    name: 'currentActorId',
    type: 'string',
    description: 'Actor aligned as the current user.',
  },
  {
    name: 'renderPart',
    type: 'ChatPartRenderer',
    description: 'Typed override for built-in or application-defined rich parts.',
  },
  {
    name: 'followOutput',
    type: 'boolean',
    description: 'Optional controlled sticky-follow state.',
  },
  {
    name: 'onMessageAction',
    type: '(payload) => void',
    description: 'Reports copy, retry, and other message action intent.',
  },
  {
    name: 'onToolApproval',
    type: '(payload) => void',
    description: 'Reports an approval or denial without executing a tool.',
  },
]

const composerProps = [
  {
    name: 'value',
    type: 'string',
    required: true,
    description: 'Controlled draft text.',
  },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    required: true,
    description: 'Called whenever the draft changes.',
  },
  {
    name: 'onSubmit',
    type: '(payload: ChatSubmitPayload) => void',
    required: true,
    description: 'Reports text and attachments when the user submits.',
  },
  {
    name: 'state',
    type: 'ChatComposerState',
    defaultValue: "'idle'",
    description: 'Controls idle, submitting, streaming, disabled, and error modes.',
  },
  {
    name: 'attachments',
    type: 'readonly ChatAttachmentData[]',
    defaultValue: '[]',
    description: 'Controlled local attachment metadata and progress.',
  },
  {
    name: 'onStop',
    type: '() => void',
    description: 'Reports a cancellation request while streaming.',
  },
]

const features = [
  {
    icon: Boxes,
    title: 'Ordered rich parts',
    text: 'Markdown, code, reasoning, tools, approvals, sources, attachments, artifacts, audio, and errors.',
  },
  {
    icon: FlaskConical,
    title: 'Controlled interaction',
    text: 'Submit, stop, retry, approval, attachment, and pagination events report intent only.',
  },
  {
    icon: Accessibility,
    title: 'Transcript ergonomics',
    text: 'Sticky follow, history anchoring, roving focus, IME-safe submission, and live status.',
  },
]

export function ChatComponentDoc() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-tint-border bg-tint-panel/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <a href="#/components/video-player" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex size-7 items-center justify-center rounded-md bg-tint-accent text-sm text-tint-on-accent">
              t
            </span>
            tint
          </a>
          <nav className="flex items-center gap-4 text-sm text-tint-muted sm:gap-5">
            <a
              href="#/components/video-player"
              className="hidden transition-colors hover:text-tint-ink sm:inline"
            >
              Video
            </a>
            <a
              href="#/chat/patterns"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-tint-ink"
            >
              <BookOpen className="size-3.5" aria-hidden="true" />
              Research
            </a>
            <a href="#usage" className="transition-colors hover:text-tint-ink">
              Usage
            </a>
            <a href="#api" className="transition-colors hover:text-tint-ink">
              API
            </a>
            <ThemeControls />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-medium tracking-[0.08em] text-tint-accent uppercase">
            Components
          </p>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-tint-ink sm:text-5xl">
            Chat
          </h1>
          <p className="text-lg leading-relaxed text-tint-muted">
            Controlled React primitives for assistant and messaging interfaces. This demo
            exercises the complete client interaction surface with deterministic mock data—no
            backend or transport required.
          </p>
        </div>

        <section id="preview" className="mb-16 scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Interactive preview</h2>
              <p className="mt-1 max-w-2xl text-tint-muted">
                Choose a scenario, send the suggested prompt, then stop, retry, approve, deny,
                attach a file, or load earlier history.
              </p>
            </div>
            <span className="rounded-md bg-tint-accent-soft px-2.5 py-1 text-xs font-medium text-tint-accent">
              Client-only demo
            </span>
          </div>
          <ChatDemo />
        </section>

        <section id="features" className="mb-16 scroll-mt-24">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Design boundaries</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-xl border border-tint-border bg-tint-panel p-5"
              >
                <span className="mb-4 grid size-9 place-items-center rounded-xl bg-tint-accent-soft text-tint-accent">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-tint-muted">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="usage" className="mb-16 scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Usage</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">
            Import from the focused subpath or the package root. Applications own the data and
            reduce the callbacks into local state, a store, or a transport adapter.
          </p>
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-base font-semibold">Controlled composition</h3>
              <CodeBlock code={usageCode} />
            </div>
            <div>
              <h3 className="mb-3 text-base font-semibold">Rich message data</h3>
              <CodeBlock code={richMessageCode} />
            </div>
          </div>
        </section>

        <section id="api" className="scroll-mt-24 space-y-10">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Code2 className="size-5 text-tint-accent" aria-hidden="true" />
              <h2 className="text-2xl font-semibold tracking-tight">API</h2>
            </div>
            <p className="mb-6 max-w-2xl text-tint-muted">
              Core props are shown here. The complete union and event payloads are available in
              the{' '}
              <a
                href="#/chat/typescript-api"
                className="font-medium text-tint-accent underline-offset-2 hover:underline"
              >
                TypeScript contract
              </a>
              .
            </p>
            <h3 className="mb-3 text-lg font-semibold">ChatMessageList</h3>
            <PropsTable rows={messageListProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatComposer</h3>
            <PropsTable rows={composerProps} />
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-tint-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-tint-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>tint · controlled React components</span>
          <span>Chat demo uses local mock data only</span>
        </div>
      </footer>
    </div>
  )
}
