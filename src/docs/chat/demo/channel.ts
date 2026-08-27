import type { ChatChannelData } from '../../../components/chat'
import {
  demoAssistant,
  demoHuman,
  initialDemoMessages,
  type ChatDemoMessage,
  type PreferencePart,
} from './scenarios'

export type ChatDemoChannel = ChatChannelData<PreferencePart>

/**
 * Structured mock of a channel's content — the object a real transport would
 * hand the client. Messages stay flat and are linked by `parentMessageId`;
 * thread shape is derived with the `thread.ts` helpers, never stored.
 *
 * The seeded exchange after the welcome message demonstrates quoted replies:
 * a human question, the assistant's answer replying to it, and a human
 * follow-up replying to that answer.
 */
const threadedExchange: readonly ChatDemoMessage[] = [
  {
    id: 'demo-thread-question',
    actor: demoHuman,
    createdAt: '2026-08-02T15:00:20Z',
    status: 'complete',
    parts: [
      {
        id: 'demo-thread-question-text',
        type: 'text',
        text: 'Can the message list show which message a reply answers?',
      },
    ],
  },
  {
    id: 'demo-thread-answer',
    actor: demoAssistant,
    createdAt: '2026-08-02T15:00:24Z',
    status: 'complete',
    parentMessageId: 'demo-thread-question',
    parts: [
      {
        id: 'demo-thread-answer-text',
        type: 'text',
        format: 'markdown',
        text:
          'Yes. Messages carry a `parentMessageId`, and the list resolves it into a quoted-reply header. Press **Reply** on any message to try it.',
      },
    ],
  },
  {
    id: 'demo-thread-followup',
    actor: demoHuman,
    createdAt: '2026-08-02T15:00:41Z',
    status: 'complete',
    parentMessageId: 'demo-thread-answer',
    parts: [
      {
        id: 'demo-thread-followup-text',
        type: 'text',
        text: 'And the thread tree itself is derived from the flat list?',
      },
    ],
  },
  {
    id: 'demo-thread-confirm',
    actor: demoAssistant,
    createdAt: '2026-08-02T15:00:47Z',
    status: 'complete',
    parentMessageId: 'demo-thread-followup',
    parts: [
      {
        id: 'demo-thread-confirm-text',
        type: 'text',
        format: 'markdown',
        text:
          'Exactly — `buildThreadTree` and `threadSummary` walk the flat list, so inserts and rethreads never reshape stored data.',
      },
    ],
  },
]

export const demoChannel: ChatDemoChannel = {
  id: 'demo-channel',
  name: 'tint-design',
  topic: 'Chat component design review',
  messages: [...initialDemoMessages, ...threadedExchange],
}
