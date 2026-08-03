import {
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import {
  ChatComposer,
  ChatConversation,
  ChatMessageList,
} from '@/components/chat'
import { cn } from '@/lib/utils'
import { useChatDemo } from './useChatDemo'
import type { ChatDemoScenarioId } from './scenarios'

export function ChatDemo() {
  const demo = useChatDemo()
  const scenario = demo.scenarios.find((item) => item.id === demo.scenarioId)!
  const active =
    demo.composerState === 'streaming' || demo.composerState === 'submitting'

  return (
    <div className="overflow-hidden rounded-2xl border border-tint-border bg-tint-surface shadow-[0_20px_60px_rgba(30,42,58,0.10)]">
      <div className="flex flex-col gap-3 border-b border-tint-border bg-tint-panel px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint-accent-soft text-tint-accent">
            <Sparkles className="size-4" aria-hidden="true" />
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
          <label className="relative min-w-0 flex-1 sm:flex-none">
            <span className="sr-only">Demo scenario</span>
            <select
              value={demo.scenarioId}
              onChange={(event) =>
                demo.setScenarioId(event.target.value as ChatDemoScenarioId)
              }
              className="h-9 w-full appearance-none rounded-lg border border-tint-border bg-tint-panel pr-8 pl-3 text-xs font-medium outline-none hover:bg-tint-surface focus:border-tint-accent focus:ring-2 focus:ring-tint-accent-soft sm:w-40"
            >
              {demo.scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-tint-muted"
              aria-hidden="true"
            />
          </label>
          <button
            type="button"
            onClick={demo.replay}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-tint-border bg-tint-panel px-2.5 text-xs font-medium hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            <FlaskConical className="size-3.5" aria-hidden="true" />
            Replay
          </button>
          <button
            type="button"
            onClick={demo.reset}
            className="inline-flex size-9 items-center justify-center rounded-lg text-tint-muted hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            aria-label="Reset conversation"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="border-b border-tint-border bg-tint-surface px-4 py-2.5 text-xs text-tint-muted">
        <span className="font-medium text-tint-ink">{scenario.label}:</span>{' '}
        {scenario.description}
      </div>

      <ChatConversation
        label="Tint chat component demonstration"
        className="h-[min(72vh,46rem)] min-h-[34rem]"
      >
        <ChatMessageList
          messages={demo.messages}
          currentActorId="demo-human"
          hasEarlier={demo.hasEarlier}
          loading={demo.loadingEarlier}
          onLoadEarlier={demo.loadEarlier}
          onMessageAction={demo.messageAction}
          onToolApproval={demo.toolApproval}
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

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-tint-border bg-tint-panel px-4 py-2.5 text-[0.6875rem] text-tint-muted">
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-tint-success" aria-hidden="true" />
          No fetch, socket, persistence, or AI SDK
        </span>
        <span>Deterministic fixtures · local timers · controlled state</span>
      </footer>
    </div>
  )
}
