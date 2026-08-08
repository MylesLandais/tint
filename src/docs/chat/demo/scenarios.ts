import type {
  ChatActor,
  ChatMessageData,
} from '../../../components/chat'

export type ChatDemoScenarioId =
  | 'research'
  | 'streaming'
  | 'error'
  | 'attachment'

export type ChatDemoScenario = {
  id: ChatDemoScenarioId
  label: string
  description: string
  prompt: string
}

export const demoHuman: ChatActor = {
  id: 'demo-human',
  name: 'You',
  kind: 'human',
}

export const demoAssistant: ChatActor = {
  id: 'demo-assistant',
  name: 'Tint Assistant',
  kind: 'assistant',
  description: 'Local component demo',
}

export const chatDemoScenarios: readonly ChatDemoScenario[] = [
  {
    id: 'research',
    label: 'Tool approval',
    description: 'Reasoning, a permission gate, a local tool result, and sources.',
    prompt: 'Compare the accessibility guidance for chat transcripts.',
  },
  {
    id: 'streaming',
    label: 'Streaming answer',
    description: 'A cancellable Markdown response with code and cited sources.',
    prompt: 'Show me a controlled React composer pattern.',
  },
  {
    id: 'error',
    label: 'Error recovery',
    description: 'A partial response fails once, then recovers when retried.',
    prompt: 'Summarize the chat component API.',
  },
  {
    id: 'attachment',
    label: 'Attachment analysis',
    description: 'Local file progress followed by a mocked analysis result.',
    prompt: 'Review this attachment and call out the important details.',
  },
] as const

export const initialDemoMessages: readonly ChatMessageData[] = [
  {
    id: 'demo-welcome',
    actor: demoAssistant,
    createdAt: '2026-08-02T15:00:00Z',
    status: 'complete',
    parts: [
      {
        id: 'demo-welcome-text',
        type: 'text',
        format: 'markdown',
        text:
          'This is a **client-only Tint demo**. Pick a scenario or send the suggested prompt to exercise streaming, tools, approvals, attachments, errors, and transcript behavior.',
      },
    ],
  },
]

export const earlierDemoMessages: readonly ChatMessageData[] = [
  {
    id: 'demo-earlier-user',
    actor: demoHuman,
    createdAt: '2026-08-02T14:45:00Z',
    status: 'complete',
    parts: [
      {
        id: 'demo-earlier-user-text',
        type: 'text',
        text: 'What makes a good chat interface?',
      },
    ],
  },
  {
    id: 'demo-earlier-assistant',
    actor: demoAssistant,
    createdAt: '2026-08-02T14:45:02Z',
    status: 'complete',
    parts: [
      {
        id: 'demo-earlier-assistant-text',
        type: 'text',
        format: 'markdown',
        text:
          'A durable chat interface separates **ordered content**, **interaction intent**, and **transport state**. The visible components should remain controlled so applications can choose their own store or protocol.',
      },
      {
        id: 'demo-earlier-code',
        type: 'code',
        language: 'tsx',
        filename: 'ControlledChat.tsx',
        code:
          '<ChatMessageList messages={messages} />\n<ChatComposer value={draft} onValueChange={setDraft} onSubmit={send} />',
      },
    ],
  },
]
