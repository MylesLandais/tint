import type {
  ChatActor,
  ChatCustomPart,
  ChatMessageData,
  ChatPreferenceData,
} from '../../../components/chat'

export type PreferencePart = ChatCustomPart & {
  kind: 'preference'
  data: ChatPreferenceData
}

export type ChatDemoMessage = ChatMessageData<PreferencePart>

export type ChatDemoScenarioId =
  | 'research'
  | 'streaming'
  | 'error'
  | 'attachment'
  | 'preference'
  | 'group'

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

export const demoMaya: ChatActor = {
  id: 'demo-maya',
  name: 'Maya',
  kind: 'assistant',
  description: 'Group-chat character',
}

export const demoJordan: ChatActor = {
  id: 'demo-jordan',
  name: 'Jordan',
  kind: 'assistant',
  description: 'Group-chat character',
}

/** Cached local clip for the group-chat TTS fixture. No outbound network. */
export const MAYA_TTS_SRC = '/audio/maya.wav'

export const MAYA_TRANSCRIPT =
  "I'm Maya. This turn is a cached clip, not a live TTS call. Use Replay to hear the same line again."

export const JORDAN_TRANSCRIPT =
  "I'm Jordan. Maya's clip is cached; mine is the same fixture with a different actor. The trace covers both of us."

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
  {
    id: 'preference',
    label: 'Response preference',
    description:
      'Two candidate answers side by side — a layout shell over ordinary built-in parts.',
    prompt: 'Show me two ways to debounce a search input.',
  },
  {
    id: 'group',
    label: 'Group chat TTS',
    description:
      'You, Maya, and Jordan. One mock trace spans both agents; Replay uses the same cached clip.',
    prompt: 'Maya, introduce yourself — then Jordan, add a beat.',
  },
] as const

export function chatDemoScenarioFromHash(hash: string): ChatDemoScenarioId | undefined {
  const queryIndex = hash.indexOf('?')
  if (queryIndex === -1) return undefined
  const value = new URLSearchParams(hash.slice(queryIndex + 1)).get('scenario')
  return chatDemoScenarios.find((scenario) => scenario.id === value)?.id
}

export const initialDemoMessages: readonly ChatDemoMessage[] = [
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
          'This is a **client-only Tint demo**. Pick a scenario or send the suggested prompt to exercise streaming, tools, approvals, attachments, preference splits, errors, and transcript behavior.',
      },
    ],
  },
]

export const earlierDemoMessages: readonly ChatDemoMessage[] = [
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
