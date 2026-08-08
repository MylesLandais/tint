import { Accessibility, Boxes, Code2, FlaskConical } from 'lucide-react'
import { Icon } from '@/components/icon'
import { CodeBlock } from '../components/CodeBlock'
import { PropsTable } from '../components/PropsTable'
import { DocsNav } from '../components/DocsNav'
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

const conversationProps = [
  {
    name: 'label',
    type: 'string',
    defaultValue: "'Conversation'",
    description: 'Accessible name for the conversation region.',
  },
  {
    name: 'density',
    type: "'compact' | 'comfortable' | 'spacious'",
    defaultValue: "'comfortable'",
    description: 'Spacing between the transcript and the composer.',
  },
]

const messageProps = [
  {
    name: 'message',
    type: 'ChatMessageData',
    required: true,
    description: 'The message to render, including its actor, status, and ordered parts.',
  },
  {
    name: 'alignment',
    type: "'start' | 'end' | 'center'",
    defaultValue: "'start'",
    description:
      '`end` is the current actor, `center` is a system notice, `start` is everyone else. `ChatMessageList` derives this from `currentActorId`.',
  },
  {
    name: 'groupPosition',
    type: "'solo' | 'first' | 'middle' | 'last'",
    defaultValue: "'solo'",
    description: 'Position within a run of consecutive messages from the same actor.',
  },
  {
    name: 'showActor',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Show the actor name and timestamp header.',
  },
  {
    name: 'showAvatar',
    type: 'boolean',
    defaultValue: 'true',
    description: 'Show the avatar. When false a spacer keeps grouped messages aligned.',
  },
  {
    name: 'renderPart',
    type: 'ChatPartRenderer',
    description: 'Typed override for built-in or application-defined rich parts.',
  },
  {
    name: 'onAction',
    type: '(payload: ChatMessageActionPayload) => void',
    description: 'Reports copy, retry, and other message-level action intent.',
  },
  {
    name: 'onToolApproval',
    type: '(payload: ChatToolApprovalPayload) => void',
    description: 'Reports an approval or denial without executing a tool.',
  },
  {
    name: 'onRenderError',
    type: '(error: Error, info: ErrorInfo) => void',
    description:
      'A part threw while rendering; the part is replaced with a notice either way — without this handler the error is only logged.',
  },
]

const textPartProps = [
  {
    name: 'part',
    type: 'ChatTextPart',
    required: true,
    description:
      '`format: "markdown"` renders sanitized GFM (raw HTML disabled, links filtered through `safeHref`); plain text otherwise.',
  },
]

const codeBlockPartProps = [
  {
    name: 'part',
    type: 'ChatCodePart',
    required: true,
    description: 'Rendered with a header (filename or language) and a Copy button.',
  },
]

const imagePartProps = [
  {
    name: 'part',
    type: 'ChatImagePart',
    required: true,
    description: 'Rendered inside a bordered figure, lazy-loaded and capped at a max height.',
  },
]

const filePartProps = [
  {
    name: 'part',
    type: 'ChatFilePart',
    required: true,
    description:
      'Attachment name, size, and status, with an upload progress bar while `status` is "uploading".',
  },
]

const audioPartProps = [
  {
    name: 'part',
    type: 'ChatAudioPart',
    required: true,
    description:
      'A native audio player, an optional decorative waveform, and an optional transcript disclosure.',
  },
]

const sourcesPartProps = [
  {
    name: 'part',
    type: 'ChatSourcesPart',
    required: true,
    description: 'A numbered grid of citation cards.',
  },
]

const reasoningPartProps = [
  {
    name: 'part',
    type: 'ChatReasoningPart',
    required: true,
    description:
      'A `<details>` disclosure. `defaultExpanded` only affects the initial open state — streaming never force-opens it.',
  },
]

const toolPartProps = [
  {
    name: 'part',
    type: 'ChatToolPart',
    required: true,
    description:
      'A `<details>` disclosure with a status badge and a JSON input/output preview, truncated past 8,000 characters.',
  },
]

const artifactPartProps = [
  {
    name: 'part',
    type: 'ChatArtifactPart',
    required: true,
    description:
      'Title, application-defined `kind`, optional description, and a JSON preview of `data` (override via `renderPart`).',
  },
]

const approvalPartProps = [
  {
    name: 'part',
    type: 'ChatApprovalPart',
    required: true,
    description:
      'Only `status: "pending"` renders the Approve/Deny controls (plus an optional reason field when `allowReason` is set).',
  },
  {
    name: 'onDecision',
    type: '(approved: boolean, reason?: string) => void',
    description: "Reports the reader's decision, plus an optional free-text note.",
  },
]

const errorPartProps = [
  {
    name: 'part',
    type: 'ChatErrorPart',
    required: true,
    description: 'Message, optional code, rendered with `role="alert"`.',
  },
  {
    name: 'onRetry',
    type: '() => void',
    description:
      'Shown as an inline Retry button only when `part.recoverable` is true and this is supplied; replaces the message-level Retry.',
  },
]

const messagePartViewProps = [
  {
    name: 'part',
    type: 'ChatBuiltInMessagePart | TCustomPart',
    required: true,
    description: 'Dispatches to the matching built-in renderer, or for `type: "custom"`, a JSON fallback.',
  },
  {
    name: 'message',
    type: 'ChatMessageData',
    required: true,
    description: 'The parent message, used to build retry/approval payloads.',
  },
  {
    name: 'renderPart',
    type: 'ChatPartRenderer',
    description: 'Tried first; returning undefined/null falls through to the built-in renderer.',
  },
  {
    name: 'onAction',
    type: '(payload: ChatMessageActionPayload) => void',
    description: "Forwarded to renderPart's context.",
  },
  {
    name: 'onToolApproval',
    type: '(payload: ChatToolApprovalPayload) => void',
    description: 'Called when an approval part reports a decision.',
  },
  {
    name: 'onRetry',
    type: '() => void',
    description: "Forwarded to the built-in error part's inline Retry button.",
  },
  {
    name: 'onRenderError',
    type: '(error: Error, info: ErrorInfo) => void',
    description: 'Called when part rendering throws; the part is replaced with a notice either way.',
  },
]

const actionButtonProps = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description: 'Accessible name — these buttons are icon-only.',
  },
  {
    name: 'pending',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Swaps the icon for a spinner, sets `aria-busy`, and disables the button.',
  },
]

const composerInputProps = [
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
    name: 'submitOnEnter',
    type: 'boolean',
    defaultValue: 'true',
    description:
      'Enter submits the containing form; Shift+Enter inserts a newline. Never fires mid-IME composition.',
  },
  {
    name: 'ref',
    type: 'Ref<HTMLTextAreaElement>',
    description: 'Access to the underlying textarea.',
  },
]

const emptyStateProps = [
  {
    name: 'children',
    type: 'ReactNode',
    defaultValue: "'Start a conversation'",
    description: 'Custom empty-state content. Falls back to a default icon and message when omitted.',
  },
]

const dateDividerProps = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'The divider label — typically a formatted date. Renders with an empty label if omitted.',
  },
]

const typingIndicatorProps = [
  {
    name: 'children',
    type: 'ReactNode',
    defaultValue: "'Assistant is responding'",
    description: 'Status text next to the spinner, inside a `role="status"` live region.',
  },
]

const scrollToBottomProps = [
  {
    name: 'children',
    type: 'ReactNode',
    defaultValue: "'New messages'",
    description:
      'Button label next to the down arrow. `onClick` performs the actual scroll — the component itself has no scrolling logic.',
  },
]

const chatUtilitiesCode = `// src/components/chat/sanitize.ts

// Removes invisible Unicode bidirectional control characters (U+202A–U+202E
// embeddings/overrides, U+2066–U+2069 isolates) from untrusted text — these
// can reorder surrounding text invisibly (e.g. spoof "invoice.exe" as
// "invoice.png"). Used internally on actor names, filenames, and link titles.
stripBidi(value: string): string

// Returns href unchanged when safe to navigate to — same-document ("#...")
// and root-relative ("/...") paths pass through; everything else must parse
// as a URL with an http:, https:, or mailto: scheme. Rejects javascript:,
// data:, vbscript:, and file:. Used by ChatText's markdown link transform
// and ChatSources.
safeHref(href?: string): string | undefined`

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
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <DocsNav current="components/chat" />
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
            {features.map(({ icon: FeatureIcon, title, text }) => (
              <article
                key={title}
                className="rounded-xl border border-tint-border bg-tint-panel p-5"
              >
                <span className="mb-4 grid size-9 place-items-center rounded-xl bg-tint-accent-soft text-tint-accent">
                  <Icon icon={FeatureIcon} />
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
              <Icon icon={Code2} size="lg" className="text-tint-accent" />
              <h2 className="text-2xl font-semibold tracking-tight">API</h2>
            </div>
            <p className="mb-6 max-w-2xl text-tint-muted">
              Core props are shown here. The complete union and event payloads are defined in{' '}
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">
                src/components/chat/types.ts
              </code>
              .
            </p>
            <h3 className="mb-3 text-lg font-semibold">ChatMessageList</h3>
            <PropsTable rows={messageListProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatComposer</h3>
            <PropsTable rows={composerProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatConversation</h3>
            <PropsTable rows={conversationProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatMessage</h3>
            <PropsTable rows={messageProps} />
          </div>

          <div>
            <p className="mb-2 text-[0.6875rem] font-semibold tracking-wide text-tint-muted uppercase">
              Rich part renderers
            </p>
            <p className="mb-6 max-w-2xl text-sm text-tint-muted">
              All twelve take a single <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">part</code> prop
              typed to their specific rich-part shape, plus <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">className</code> and
              native attributes; two also take a callback.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatText</h3>
            <PropsTable rows={textPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatCodeBlock</h3>
            <PropsTable rows={codeBlockPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatImage</h3>
            <PropsTable rows={imagePartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatFile</h3>
            <PropsTable rows={filePartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatAudio</h3>
            <PropsTable rows={audioPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatSources</h3>
            <PropsTable rows={sourcesPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatReasoning</h3>
            <PropsTable rows={reasoningPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatTool</h3>
            <PropsTable rows={toolPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatArtifact</h3>
            <PropsTable rows={artifactPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatApproval</h3>
            <PropsTable rows={approvalPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatError</h3>
            <PropsTable rows={errorPartProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatMessagePartView</h3>
            <p className="mb-3 max-w-2xl text-sm text-tint-muted">
              The dispatcher every rich part above renders through. Its prop type is defined
              inline in <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">ChatParts.tsx</code> rather
              than exported from <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">types.ts</code> like
              its siblings — a minor, pre-existing inconsistency.
            </p>
            <PropsTable rows={messagePartViewProps} />
          </div>

          <div>
            <p className="mb-2 text-[0.6875rem] font-semibold tracking-wide text-tint-muted uppercase">
              Composer parts
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatActionButton</h3>
            <PropsTable rows={actionButtonProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatComposerInput</h3>
            <PropsTable rows={composerInputProps} />
          </div>

          <div>
            <p className="mb-2 text-[0.6875rem] font-semibold tracking-wide text-tint-muted uppercase">
              Slots
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatEmptyState</h3>
            <PropsTable rows={emptyStateProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatDateDivider</h3>
            <PropsTable rows={dateDividerProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatTypingIndicator</h3>
            <PropsTable rows={typingIndicatorProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">ChatScrollToBottom</h3>
            <PropsTable rows={scrollToBottomProps} />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold">Layout slots</h3>
            <p className="max-w-2xl text-sm text-tint-muted">
              Five plain wrapper elements with no props beyond <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">className</code> and
              native attributes — layout only, no owned behavior:{' '}
              <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">ChatPartContainer</code> (rich-part
              wrapper), <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">ChatMessageContent</code> (parts
              container), <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">ChatMessageActions</code> (action-button
              row), <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">ChatComposerAttachments</code> (attachment
              chip row), and <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">ChatComposerFooter</code> (footer
              row).
            </p>
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">Utilities</h2>
          <p className="mt-0 mb-5 text-base leading-7 text-tint-muted">
            Two plain functions the built-in renderers use internally, exported so a custom{' '}
            <code className="rounded bg-tint-surface px-1.5 py-0.5 text-[13px]">renderPart</code> can
            reuse the same safety checks.
          </p>
          <CodeBlock code={chatUtilitiesCode} language="ts" />
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
