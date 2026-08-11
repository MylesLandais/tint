import {
  AlertCircle,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Code2,
  Copy,
  ExternalLink,
  File,
  FileText,
  Globe2,
  ImageIcon,
  Music2,
  RotateCcw,
  ShieldCheck,
  Terminal,
  Wrench,
  XCircle,
} from 'lucide-react'
import {
  Component,
  useState,
  type ErrorInfo,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '../../lib/utils'
import { HighlightedCode } from '../code'
import { MediaPlayer } from '../media-player'
import { Icon, Spinner, StatusIcon, STATUS_ICONS } from '../icon'
import type { StatusName } from '../icon'
import { safeHref, stripBidi } from './sanitize'
import { useCopied } from '../../lib/useCopied'
import type {
  ChatApprovalPart,
  ChatArtifactPart,
  ChatAudioPart,
  ChatBuiltInMessagePart,
  ChatCodePart,
  ChatCustomPart,
  ChatErrorPart,
  ChatFilePart,
  ChatImagePart,
  ChatMessageData,
  ChatMessageActionPayload,
  ChatPartRenderer,
  ChatReasoningPart,
  ChatRichPartProps,
  ChatSourcesPart,
  ChatTextPart,
  ChatToolApprovalPayload,
  ChatToolPart,
  ChatToolStatus,
} from './types'

/**
 * Tool results and artifact payloads are arbitrary application data. A large one
 * serialized in full becomes megabytes of DOM inside a `<details>` that is already
 * mounted, so the preview is capped and the reader is told what was withheld.
 */
const MAX_JSON_PREVIEW = 8_000

function jsonPreview(value: unknown) {
  let serialized: string
  try {
    serialized = JSON.stringify(value, null, 2) ?? String(value)
  } catch {
    return { text: 'Unable to display this value.', truncated: false, total: 0 }
  }

  return serialized.length > MAX_JSON_PREVIEW
    ? {
        text: serialized.slice(0, MAX_JSON_PREVIEW),
        truncated: true,
        total: serialized.length,
      }
    : { text: serialized, truncated: false, total: serialized.length }
}

function JsonPreview({ value, className }: { value: unknown; className?: string }) {
  const { text, truncated, total } = jsonPreview(value)

  return (
    <>
      <pre className={className}>{text}</pre>
      {truncated ? (
        <p className="mt-1.5 text-[0.6875rem] text-tint-muted">
          Showing the first {MAX_JSON_PREVIEW.toLocaleString()} of{' '}
          {total.toLocaleString()} characters.
        </p>
      ) : null}
    </>
  )
}

/** Turn a wire status token such as `approval-required` into `Approval required`. */
function humanizeStatus(status: string) {
  const label = status.replace(/[-_]+/g, ' ').trim().slice(0, 32)
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : 'Unknown'
}

export function ChatText({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatTextPart>) {
  if (part.format !== 'markdown') {
    return (
      <div
        data-chat-part="text"
        data-status={part.status}
        className={cn('whitespace-pre-wrap text-[0.9375rem] leading-7', className)}
        {...props}
      >
        {part.text}
      </div>
    )
  }

  return (
    <div
      data-chat-part="markdown"
      data-status={part.status}
      className={cn(
        'min-w-0 text-[0.9375rem] leading-7 break-words [&_a]:font-medium [&_a]:text-tint-accent [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-tint-border [&_blockquote]:pl-4 [&_code]:rounded [&_code]:bg-tint-surface [&_code]:px-1 [&_code]:py-0.5 [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_strong]:font-semibold [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-tint-border [&_td]:p-2 [&_th]:border [&_th]:border-tint-border [&_th]:bg-tint-surface [&_th]:p-2 [&_ul]:my-2',
        className,
      )}
      {...props}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) => safeHref(url) ?? ''}
        components={{
          a: ({ href, children, ...anchorProps }) => {
            const safe = safeHref(href)
            return safe ? (
              <a
                href={safe}
                target={safe.startsWith('http') ? '_blank' : undefined}
                rel={safe.startsWith('http') ? 'noreferrer noopener' : undefined}
                {...anchorProps}
              >
                {children}
              </a>
            ) : (
              <span>{children}</span>
            )
          },
        }}
      >
        {part.text}
      </ReactMarkdown>
    </div>
  )
}

export function ChatCodeBlock({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatCodePart>) {
  const { copied, copy } = useCopied(part.code)

  return (
    <section
      data-chat-part="code"
      data-status={part.status}
      className={cn(
        'overflow-hidden rounded-xl border border-tint-code-border bg-tint-code text-tint-code-ink',
        className,
      )}
      {...props}
    >
      <header className="flex items-center justify-between border-b border-tint-code-border px-3 py-2 text-xs text-tint-code-muted">
        <span className="flex items-center gap-2">
          <Icon icon={Code2} size="sm" />
          {part.filename ?? part.language ?? 'Code'}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-tint-code-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-code-ink"
          aria-label={copied ? 'Code copied' : 'Copy code'}
        >
          {copied ? <Icon icon={Check} size="sm" /> : <Icon icon={Copy} size="sm" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </header>
      <pre className="overflow-x-auto p-4 text-[0.8125rem] leading-6">
        <HighlightedCode code={part.code} language={part.language} />
      </pre>
    </section>
  )
}

export function ChatImage({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatImagePart>) {
  return (
    <figure
      data-chat-part="image"
      data-status={part.status}
      className={cn(
        'overflow-hidden rounded-xl border border-tint-border bg-tint-surface',
        className,
      )}
      {...props}
    >
      <img
        src={part.src}
        alt={part.alt}
        width={part.width}
        height={part.height}
        loading="lazy"
        decoding="async"
        className="max-h-96 w-full object-contain"
      />
    </figure>
  )
}

function readableSize(size?: number) {
  if (size === undefined) return undefined
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function ChatFile({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatFilePart>) {
  const { attachment } = part
  const icon = attachment.mediaType.startsWith('image/') ? (
    <Icon icon={ImageIcon} />
  ) : (
    <Icon icon={FileText} />
  )

  return (
    <article
      data-chat-part="file"
      data-status={attachment.status ?? part.status}
      className={cn(
        'flex min-w-0 items-center gap-3 rounded-xl border border-tint-border bg-tint-panel p-3',
        className,
      )}
      {...props}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-tint-surface text-tint-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{stripBidi(attachment.name)}</div>
        <div className="mt-0.5 text-xs text-tint-muted">
          {[
            readableSize(attachment.size),
            attachment.status ? humanizeStatus(attachment.status) : undefined,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
        {attachment.status === 'uploading' ? (
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint-surface"
            role="progressbar"
            aria-label={`Uploading ${stripBidi(attachment.name)}`}
            aria-valuenow={attachment.uploadProgress ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span
              className="block h-full rounded-full bg-tint-accent transition-[width]"
              style={{ width: `${attachment.uploadProgress ?? 0}%` }}
            />
          </div>
        ) : null}
        {attachment.error ? (
          <p className="mt-1 text-xs text-tint-danger-ink">{attachment.error}</p>
        ) : null}
      </div>
    </article>
  )
}

export function ChatAudio({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatAudioPart>) {
  return (
    <section
      data-chat-part="audio"
      data-status={part.status}
      className={cn(
        'rounded-xl border border-tint-border bg-tint-panel p-3',
        className,
      )}
      {...props}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-tint-muted">
        <Icon icon={Music2} />
        Audio
      </div>
      <MediaPlayer
        kind="audio"
        src={part.src}
        label={part.title ?? 'audio message'}
        title={part.title}
        artist={part.artist}
        artwork={part.artwork}
        artworkAlt={part.artworkAlt}
        duration={part.duration}
        waveform={part.waveform}
      />
      {part.transcript ? (
        <details className="mt-2 text-sm">
          <summary className="cursor-pointer text-xs font-medium">Transcript</summary>
          <p className="mt-2 text-tint-muted">{part.transcript}</p>
        </details>
      ) : null}
    </section>
  )
}

export function ChatSources({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatSourcesPart>) {
  return (
    <section
      data-chat-part="sources"
      data-status={part.status}
      className={cn('space-y-2', className)}
      {...props}
    >
      <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wide text-tint-muted uppercase">
        <Icon icon={Globe2} size="sm" />
        Sources
      </h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {part.sources.map((source, index) => {
          const href = safeHref(source.url)
          const content = (
            <>
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-tint-accent-soft text-[0.6875rem] font-semibold text-tint-accent">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">
                  {stripBidi(source.title)}
                </span>
                {source.description ? (
                  <span className="mt-0.5 block line-clamp-2 text-[0.6875rem] leading-4 text-tint-muted">
                    {source.description}
                  </span>
                ) : null}
              </span>
              {href ? <Icon icon={ExternalLink} size="sm" className="shrink-0" /> : null}
            </>
          )

          return href ? (
            <a
              key={source.id}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer noopener' : undefined}
              className="flex items-start gap-2 rounded-lg border border-tint-border bg-tint-panel p-2.5 transition hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            >
              {content}
            </a>
          ) : (
            <div
              key={source.id}
              className="flex items-start gap-2 rounded-lg border border-tint-border bg-tint-panel p-2.5"
            >
              {content}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ChatReasoning({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatReasoningPart>) {
  const active = part.status === 'pending' || part.status === 'streaming'
  const [expanded, setExpanded] = useState(Boolean(part.defaultExpanded))

  return (
    <details
      data-chat-part="reasoning"
      data-status={part.status}
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
      className={cn(
        'group rounded-xl border border-tint-border bg-tint-surface',
        className,
      )}
      {...props}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-medium text-tint-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent">
        {active ? <Spinner size="sm" /> : <Icon icon={Brain} size="sm" />}
        <span>{part.title ?? (active ? 'Thinking' : 'Reasoning')}</span>
        {part.durationMs ? (
          <span className="ml-auto flex items-center gap-1 font-normal">
            <Icon icon={Clock3} size="xs" />
            {(part.durationMs / 1000).toFixed(1)}s
          </span>
        ) : (
          <Icon
            icon={ChevronDown}
            size="sm"
            className="ml-auto transition-transform group-open:rotate-180"
          />
        )}
      </summary>
      <div className="border-t border-tint-border px-3 py-3 text-sm leading-6 text-tint-muted">
        {part.text}
      </div>
    </details>
  )
}

/**
 * Maps the network-facing `ChatToolStatus` union onto the shared `StatusName`
 * registry. `ChatToolData` is application data that usually arrives over a
 * network, where `ChatToolStatus` is not enforced, so an unrecognized token
 * still needs a presentation (`humanizeStatus` below) rather than
 * dereferencing `undefined` and taking the transcript down — that fallback is
 * app-data resilience the strictly-typed shared registry shouldn't inherit,
 * which is why this stays a thin local adapter instead of folding into it.
 */
const TOOL_STATUS_MAP: Partial<Record<string, StatusName>> = {
  pending: 'pending',
  running: 'loading',
  'approval-required': 'needs-approval',
  succeeded: 'success',
  failed: 'error',
  cancelled: 'cancelled',
}

function toolStatusName(status: ChatToolStatus): StatusName {
  return TOOL_STATUS_MAP[status] ?? 'pending'
}

function toolLabel(status: ChatToolStatus): string {
  const mapped = TOOL_STATUS_MAP[status]
  return mapped ? STATUS_ICONS[mapped].label : humanizeStatus(status)
}

export function ChatTool({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatToolPart>) {
  const statusName = toolStatusName(part.tool.status)

  return (
    <details
      data-chat-part="tool"
      data-status={part.tool.status}
      className={cn(
        'group overflow-hidden rounded-xl border border-tint-border bg-tint-panel',
        className,
      )}
      {...props}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent">
        <span className="grid size-8 place-items-center rounded-lg bg-tint-surface">
          <Icon icon={Wrench} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {part.tool.title ?? part.tool.name}
          </span>
          {part.tool.summary ? (
            <span className="mt-0.5 block truncate text-xs text-tint-muted">
              {part.tool.summary}
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            STATUS_ICONS[statusName].tone,
          )}
        >
          <StatusIcon status={statusName} size="sm" />
          {toolLabel(part.tool.status)}
        </span>
        <Icon
          icon={ChevronDown}
          size="sm"
          className="text-tint-muted transition-transform group-open:rotate-180"
        />
      </summary>
      {part.tool.input !== undefined ||
      part.tool.output !== undefined ||
      part.tool.error ? (
        <div className="space-y-3 border-t border-tint-border bg-tint-surface p-3">
          {part.tool.input !== undefined ? (
            <div>
              <h5 className="mb-1.5 text-[0.6875rem] font-semibold tracking-wide text-tint-muted uppercase">
                Input
              </h5>
              <JsonPreview
                value={part.tool.input}
                className="overflow-x-auto rounded-lg bg-tint-panel p-2.5 text-xs"
              />
            </div>
          ) : null}
          {part.tool.output !== undefined ? (
            <div>
              <h5 className="mb-1.5 text-[0.6875rem] font-semibold tracking-wide text-tint-muted uppercase">
                Output
              </h5>
              <JsonPreview
                value={part.tool.output}
                className="overflow-x-auto rounded-lg bg-tint-panel p-2.5 text-xs"
              />
            </div>
          ) : null}
          {part.tool.error ? (
            <p className="rounded-lg bg-tint-danger-soft p-2.5 text-xs text-tint-danger-ink">
              {part.tool.error}
            </p>
          ) : null}
        </div>
      ) : null}
    </details>
  )
}

export type ChatApprovalProps = ChatRichPartProps<ChatApprovalPart> & {
  onDecision?: (approved: boolean, reason?: string) => void
}

export function ChatApproval({
  part,
  onDecision,
  className,
  ...props
}: ChatApprovalProps) {
  const [reason, setReason] = useState('')
  const pending = part.approval.status === 'pending'

  return (
    <section
      data-chat-part="approval"
      data-status={part.approval.status}
      className={cn(
        'rounded-xl border border-tint-warning/35 bg-tint-warning-soft p-4',
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-tint-warning/20 text-tint-warning-ink">
          <Icon icon={ShieldCheck} />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-tint-warning-ink">
            {part.approval.title}
          </h4>
          {part.approval.description ? (
            <p className="mt-1 text-sm leading-6 text-tint-warning-ink">
              {part.approval.description}
            </p>
          ) : null}
        </div>
      </div>

      {pending && part.approval.allowReason ? (
        <label className="mt-3 block text-xs font-medium text-tint-warning-ink">
          Optional note
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            className="mt-1.5 w-full resize-y rounded-lg border border-tint-warning/35 bg-tint-panel px-3 py-2 text-sm font-normal text-tint-ink outline-none focus:border-tint-warning focus:ring-2 focus:ring-tint-warning/30"
            placeholder="Add context for this decision"
          />
        </label>
      ) : null}

      {pending ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onDecision?.(false, reason || undefined)}
            className="rounded-lg border border-tint-warning/45 bg-tint-panel px-3 py-2 text-xs font-semibold text-tint-warning-ink hover:bg-tint-warning-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-warning"
          >
            {part.approval.denyLabel ?? 'Deny'}
          </button>
          {/* Approve is the primary action, so it takes the accent rather than a
              solid warning fill — a theme whose warning is a bright yellow
              (gruvbox #fabd2f) has no readable foreground for a filled button. */}
          <button
            type="button"
            onClick={() => onDecision?.(true, reason || undefined)}
            className="rounded-lg bg-tint-accent px-3 py-2 text-xs font-semibold text-tint-on-accent hover:bg-tint-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            {part.approval.approveLabel ?? 'Approve'}
          </button>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-tint-warning-ink">
          {part.approval.status === 'approved' ? (
            <Icon icon={CheckCircle2} size="sm" className="text-tint-success" />
          ) : (
            <Icon icon={XCircle} size="sm" className="text-tint-danger" />
          )}
          {part.approval.status === 'approved' ? 'Approved' : 'Denied'}
        </p>
      )}
    </section>
  )
}

export function ChatArtifact({
  part,
  className,
  ...props
}: ChatRichPartProps<ChatArtifactPart>) {
  return (
    <section
      data-chat-part="artifact"
      data-status={part.status}
      className={cn(
        'overflow-hidden rounded-xl border border-tint-border bg-tint-panel',
        className,
      )}
      {...props}
    >
      <header className="flex items-center gap-2 border-b border-tint-border px-3 py-2.5">
        <Icon icon={Terminal} className="text-tint-accent" />
        <div className="min-w-0">
          <h4 className="truncate text-sm font-medium">{part.title}</h4>
          <p className="text-xs text-tint-muted">{part.kind}</p>
        </div>
      </header>
      {part.description ? (
        <p className="px-3 pt-3 text-sm text-tint-muted">
          {part.description}
        </p>
      ) : null}
      <div className="m-3">
        <JsonPreview
          value={part.data}
          className="overflow-x-auto rounded-lg bg-tint-surface p-3 text-xs"
        />
      </div>
    </section>
  )
}

export type ChatErrorProps = ChatRichPartProps<ChatErrorPart> & {
  onRetry?: () => void
}

export function ChatError({
  part,
  onRetry,
  className,
  ...props
}: ChatErrorProps) {
  return (
    <section
      role="alert"
      data-chat-part="error"
      data-status={part.status}
      className={cn(
        'flex items-start gap-3 rounded-xl border border-tint-danger/35 bg-tint-danger-soft p-3 text-tint-danger-ink',
        className,
      )}
      {...props}
    >
      <Icon icon={AlertCircle} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm">{part.message}</p>
        {part.code ? <p className="mt-1 text-xs text-tint-danger-ink/80">{part.code}</p> : null}
      </div>
      {part.recoverable && onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold hover:bg-tint-danger/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-danger"
        >
          <Icon icon={RotateCcw} size="sm" />
          Retry
        </button>
      ) : null}
    </section>
  )
}

/** Shared dispatcher for built-in part types (message body and preference columns). */
export function ChatBuiltInPart({
  part,
  onApproval,
  onRetry,
}: {
  part: ChatBuiltInMessagePart
  onApproval?: (approved: boolean, reason?: string) => void
  onRetry?: () => void
}) {
  switch (part.type) {
    case 'text':
      return <ChatText part={part} />
    case 'code':
      return <ChatCodeBlock part={part} />
    case 'image':
      return <ChatImage part={part} />
    case 'file':
      return <ChatFile part={part} />
    case 'audio':
      return <ChatAudio part={part} />
    case 'sources':
      return <ChatSources part={part} />
    case 'reasoning':
      return <ChatReasoning part={part} />
    case 'tool':
      return <ChatTool part={part} />
    case 'approval':
      return <ChatApproval part={part} onDecision={onApproval} />
    case 'artifact':
      return <ChatArtifact part={part} />
    case 'error':
      return <ChatError part={part} onRetry={onRetry} />
    default:
      // `ChatMessagePart` is a compile-time union, but messages are usually
      // deserialized from a server response where nothing enforces it. Show the
      // part rather than dropping it silently — React permits an `undefined`
      // return, so a missing branch would make the content simply vanish.
      return <UnsupportedPart kind={(part as { type?: string }).type} />
  }
}

function UnsupportedPart({ kind }: { kind?: string }) {
  return (
    <div
      role="alert"
      data-chat-part="unsupported"
      className="flex items-center gap-2 rounded-lg border border-dashed border-tint-border bg-tint-surface p-3 text-sm text-tint-muted"
    >
      <Icon icon={AlertCircle} className="shrink-0" />
      {kind
        ? `This message contains a “${humanizeStatus(kind)}” part this version cannot display.`
        : 'This message contains a part this version cannot display.'}
    </div>
  )
}

type PartRenderBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  onError?: (error: Error, info: ErrorInfo) => void
}

type PartRenderBoundaryState = {
  failed: boolean
}

class PartRenderBoundary extends Component<
  PartRenderBoundaryProps,
  PartRenderBoundaryState
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a broken renderer isolated to its message part — but never silently.
    // Swallowing this entirely makes a consumer's crash invisible in production.
    if (this.props.onError) {
      this.props.onError(error, info)
    } else {
      console.error('[tint] A chat message part failed to render.', error, info)
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function ChatMessagePartView<TCustomPart extends ChatCustomPart = never>({
  part,
  message,
  renderPart,
  onAction,
  onToolApproval,
  onRetry,
  onRenderError,
}: {
  part: ChatBuiltInMessagePart | TCustomPart
  message: ChatMessageData<TCustomPart>
  renderPart?: ChatPartRenderer<TCustomPart>
  onAction?: (payload: ChatMessageActionPayload) => void
  onToolApproval?: (payload: ChatToolApprovalPayload) => void
  onRetry?: () => void
  onRenderError?: (error: Error, info: ErrorInfo) => void
}) {
  const fallback = (
    <div
      role="alert"
      data-chat-part="render-error"
      className="flex items-center gap-2 rounded-lg border border-tint-danger/35 bg-tint-danger-soft p-3 text-sm text-tint-danger-ink"
    >
      <Icon icon={AlertCircle} />
      This message part could not be displayed.
    </div>
  )

  let rendered: ReactNode
  try {
    rendered = renderPart?.(part, {
      message,
      isStreaming: message.status === 'streaming',
      onAction,
      onToolApproval,
    })
  } catch (error) {
    onRenderError?.(error as Error, { componentStack: '' })
    return fallback
  }

  let content: ReactNode
  if (rendered !== undefined && rendered !== null) {
    content = rendered
  } else if (part.type === 'custom') {
    content = (
      <section
        data-chat-part="custom"
        className="rounded-xl border border-dashed border-tint-border bg-tint-surface p-3"
      >
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
          <Icon icon={File} size="sm" />
          {stripBidi(part.kind)}
        </div>
        <JsonPreview
          value={part.data}
          className="overflow-x-auto text-xs text-tint-muted"
        />
      </section>
    )
  } else {
    content = (
      <ChatBuiltInPart
        part={part}
        onRetry={onRetry}
        // Only approval parts can produce a decision, so the handler exists only
        // for them rather than being defended against inside the callback.
        onApproval={
          part.type === 'approval'
            ? (approved, reason) => {
                onToolApproval?.({
                  messageId: message.id,
                  partId: part.id,
                  approvalId: part.approval.id,
                  approved,
                  reason,
                })
              }
            : undefined
        }
      />
    )
  }

  // Every branch is wrapped, not just the consumer renderer: built-in parts hand
  // application data (tool status tokens, artifact payloads) to code that would
  // otherwise take the whole transcript down with it.
  return (
    <PartRenderBoundary
      key={`${part.id}:${part.status ?? ''}:${message.status}`}
      fallback={fallback}
      onError={onRenderError}
    >
      {content}
    </PartRenderBoundary>
  )
}

export function ChatPartContainer({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0', className)} {...props} />
}
