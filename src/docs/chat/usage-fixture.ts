import type {
  ChatComposerProps,
  ChatCustomPart,
  ChatMessageData,
  ChatMessageListProps,
} from 'tint/chat'

type WeatherPart = ChatCustomPart & {
  kind: 'weather'
  data: {
    temperature: number
    condition: string
  }
}

export const exampleMessages = [
  {
    id: 'message-user-1',
    actor: {
      id: 'person-1',
      name: 'Myles',
      kind: 'human',
    },
    createdAt: '2026-08-02T14:00:00Z',
    status: 'complete',
    parts: [
      {
        id: 'part-user-text',
        type: 'text',
        format: 'plain',
        text: 'Check the weather and explain whether I need a jacket.',
      },
    ],
  },
  {
    id: 'message-assistant-1',
    actor: {
      id: 'assistant-1',
      name: 'Tint Assistant',
      kind: 'assistant',
    },
    createdAt: '2026-08-02T14:00:01Z',
    status: 'streaming',
    parts: [
      {
        id: 'part-reasoning',
        type: 'reasoning',
        status: 'complete',
        title: 'Checked the forecast',
        text: 'I compared the temperature, wind, and precipitation.',
      },
      {
        id: 'part-tool',
        type: 'tool',
        tool: {
          id: 'tool-weather',
          name: 'get_weather',
          title: 'Weather',
          status: 'succeeded',
          input: { location: 'Chicago' },
          output: { temperature: 62, condition: 'windy' },
        },
      },
      {
        id: 'part-weather',
        type: 'custom',
        kind: 'weather',
        data: {
          temperature: 62,
          condition: 'windy',
        },
      },
      {
        id: 'part-answer',
        type: 'text',
        format: 'markdown',
        status: 'streaming',
        text: 'Bring a **light jacket**—it is cool and windy.',
      },
    ],
  },
] satisfies readonly ChatMessageData<WeatherPart>[]

export const exampleMessageListProps = {
  messages: exampleMessages,
  currentActorId: 'person-1',
  followOutput: true,
  enableRovingFocus: true,
  onFollowOutputChange: (_following) => undefined,
  onMessageAction: (_payload) => undefined,
  onToolApproval: (_payload) => undefined,
} satisfies ChatMessageListProps<WeatherPart>

export const exampleComposerProps = {
  value: '',
  state: 'streaming',
  attachments: [],
  placeholder: 'Message Tint Assistant…',
  submitOnEnter: true,
  onValueChange: (_value) => undefined,
  onSubmit: (_payload) => undefined,
  onStop: () => undefined,
  onAttachmentAdd: (_files) => undefined,
  onAttachmentRemove: (_attachmentId) => undefined,
} satisfies ChatComposerProps
