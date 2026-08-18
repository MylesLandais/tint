import { useEffect, useRef, useState } from 'react'
import {
  CheckCircle2,
  FlaskConical,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  ChatComposer,
  ChatConversation,
  ChatMessageList,
  ChatPreference,
} from '../../../components/chat'
import { Icon } from '../../../components/icon'
import { Panel } from '../../../components/panel'
import { TraceViewer } from '../../../components/telemetry/TraceViewer'
import { cn } from '../../../lib/utils'
import { useChatDemo } from './useChatDemo'
import { chatDemoShouldAutoReplay, type PreferencePart } from './scenarios'

export function ChatDemo() {
  const demo = useChatDemo()
  const [traceOpen, setTraceOpen] = useState(true)
  const autoReplayRef = useRef(false)
  const scenario = demo.scenarios.find((item) => item.id === demo.scenarioId)!
  const active =
    demo.composerState === 'streaming' || demo.composerState === 'submitting'
  const groupTrace = demo.scenarioId === 'group' ? demo.traces[0] : undefined

  useEffect(() => {
    if (autoReplayRef.current) return
    if (!chatDemoShouldAutoReplay(window.location.hash)) return
    autoReplayRef.current = true
    demo.replay()
  }, [demo])

  return (
    <div className="overflow-hidden rounded-2xl border border-tint-border bg-tint-surface shadow-[0_20px_60px_rgba(30,42,58,0.10)]">
      <div className="flex flex-col gap-3 border-b border-tint-border bg-tint-panel px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint-accent-soft text-tint-accent">
            <Icon icon={Sparkles} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">Tint Assistant</h3>
            <p className="flex items-center gap-1.5 text-xs text-tint-muted">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  active
                    ? 'animate-pulse bg-tint-info motion-reduce:animate-none'
                    : 'bg-tint-success',
                )}
              />
              {active ? 'Running local scenario' : 'Ready · mock data only'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={demo.replay}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-tint-border bg-tint-panel px-2.5 text-xs font-medium hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            <Icon icon={FlaskConical} size="sm" />
            Replay
          </button>
          <button
            type="button"
            onClick={demo.reset}
            className="inline-flex size-9 items-center justify-center rounded-lg text-tint-muted hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            aria-label="Reset conversation"
          >
            <Icon icon={RotateCcw} size="sm" />
          </button>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Demo scenario"
        className="flex flex-wrap gap-1 border-b border-tint-border bg-tint-panel px-3 py-2 sm:px-4"
      >
        {demo.scenarios.map((item) => {
          const pressed = demo.scenarioId === item.id
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={pressed}
              onClick={() => demo.setScenarioId(item.id)}
              className={cn(
                'h-7 rounded-md border px-2 text-[0.6875rem] font-medium outline-none',
                'focus-visible:ring-2 focus-visible:ring-tint-accent-soft',
                pressed
                  ? 'border-tint-accent bg-tint-accent-soft text-tint-accent'
                  : 'border-tint-border bg-tint-surface text-tint-muted hover:text-tint-ink',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="border-b border-tint-border bg-tint-surface px-4 py-2.5 text-xs text-tint-muted">
        <span className="font-medium text-tint-ink">{scenario.label}:</span>{' '}
        {scenario.description}
      </div>

      <ChatConversation
        label="Tint chat component demonstration"
        className="h-[min(72vh,46rem)] min-h-[34rem]"
      >
        <ChatMessageList<PreferencePart>
          messages={demo.messages}
          currentActorId="demo-human"
          hasEarlier={demo.hasEarlier}
          loading={demo.loadingEarlier}
          onLoadEarlier={demo.loadEarlier}
          onMessageAction={demo.messageAction}
          onToolApproval={demo.toolApproval}
          enableSpeak={demo.scenarioId === 'group'}
          onSpeakingMessageIdChange={(messageId) => {
            if (messageId) demo.recordSpeak(messageId)
          }}
          renderPart={(part, context) => {
            if (part.type !== 'custom' || part.kind !== 'preference') return undefined
            return (
              <ChatPreference
                title={part.data.title}
                subtitle={part.data.subtitle}
                options={part.data.options}
                selectedOptionId={part.data.selectedOptionId}
                status={part.data.status}
                onSelect={(optionId) =>
                  demo.selectPreference(context.message.id, part.id, optionId)
                }
              />
            )
          }}
        />
        <ChatComposer
          value={demo.draft}
          onValueChange={demo.setDraft}
          attachments={demo.attachments}
          state={demo.composerState}
          error={
            demo.composerState === 'error'
              ? 'The mock stream failed. Use Retry on the assistant message.'
              : undefined
          }
          placeholder={scenario.prompt}
          accept="image/*,.pdf,.txt,.md,.json"
          onSubmit={demo.submit}
          onStop={demo.stop}
          onAttachmentAdd={demo.addAttachments}
          onAttachmentRemove={demo.removeAttachment}
        />
      </ChatConversation>

      {groupTrace ? (
        <div className="border-t border-tint-border bg-tint-surface p-3">
          <Panel
            title="Agent traces"
            status={
              <span className="font-mono text-[0.6875rem] text-tint-muted">
                {groupTrace.spans.length} spans · {groupTrace.traceId}
              </span>
            }
            expanded={traceOpen}
            onExpandedChange={setTraceOpen}
          >
            <div className="p-3">
              <TraceViewer trace={groupTrace} />
            </div>
          </Panel>
        </div>
      ) : null}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-tint-border bg-tint-panel px-4 py-2.5 text-[0.6875rem] text-tint-muted">
        <span className="inline-flex items-center gap-1.5">
          <Icon icon={CheckCircle2} size="sm" className="text-tint-success" />
          No fetch, socket, persistence, or AI SDK
        </span>
        <span>Deterministic fixtures · local timers · mocked traces</span>
      </footer>
    </div>
  )
}
