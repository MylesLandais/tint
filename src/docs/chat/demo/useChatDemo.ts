import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ChatAttachmentData,
  ChatComposerState,
  ChatId,
  ChatMessageActionPayload,
  ChatMessagePart,
  ChatSubmitPayload,
  ChatToolApprovalPayload,
} from '../../../components/chat'
import {
  chatDemoScenarios,
  demoAssistant,
  demoHuman,
  earlierDemoMessages,
  type ChatDemoMessage,
  type ChatDemoScenarioId,
  type PreferencePart,
} from './scenarios'
import { demoChannel } from './channel'

const STREAM_DELAY = 84
const DEMO_BASE_TIME = Date.parse('2026-08-02T15:01:00Z')

type DemoPart = ChatMessagePart<PreferencePart>

function replaceMessage(
  messages: readonly ChatDemoMessage[],
  id: string,
  update: (message: ChatDemoMessage) => ChatDemoMessage,
) {
  return messages.map((message) => (message.id === id ? update(message) : message))
}

function replacePart(
  message: ChatDemoMessage,
  partId: string,
  update: (part: DemoPart) => DemoPart,
): ChatDemoMessage {
  return {
    ...message,
    parts: message.parts.map((part) => (part.id === partId ? update(part) : part)),
  }
}

function appendText(
  message: ChatDemoMessage,
  partId: string,
  chunk: string,
): ChatDemoMessage {
  return replacePart(message, partId, (part) =>
    part.type === 'text'
      ? {
          ...part,
          text: `${part.text}${chunk}`,
          status: 'streaming',
        }
      : part,
  )
}

function userMessage(
  id: string,
  payload: ChatSubmitPayload,
  createdAt: number,
  parentMessageId?: ChatId,
): ChatDemoMessage {
  const parts: DemoPart[] = []
  if (payload.text) {
    parts.push({
      id: `${id}-text`,
      type: 'text',
      text: payload.text,
    })
  }
  for (const attachment of payload.attachments) {
    parts.push({
      id: `${id}-${attachment.id}`,
      type: 'file',
      attachment: {
        ...attachment,
        status: 'ready',
        uploadProgress: 100,
      },
    })
  }

  return {
    id,
    actor: demoHuman,
    createdAt,
    status: 'complete',
    parts,
    parentMessageId,
  }
}

function pendingAssistantMessage(
  id: string,
  title: string,
  createdAt: number,
): ChatDemoMessage {
  return {
    id,
    actor: demoAssistant,
    createdAt,
    status: 'streaming',
    parts: [
      {
        id: `${id}-reasoning`,
        type: 'reasoning',
        title,
        text: 'Organizing the request into UI states and component responsibilities…',
        status: 'streaming',
      },
    ],
  }
}

export function useChatDemo() {
  const [scenarioId, setScenarioIdState] =
    useState<ChatDemoScenarioId>('research')
  const [messages, setMessages] =
    useState<readonly ChatDemoMessage[]>(demoChannel.messages)
  const [replyTo, setReplyTo] = useState<ChatDemoMessage | null>(null)
  const [draft, setDraft] = useState(
    chatDemoScenarios.find((scenario) => scenario.id === 'research')?.prompt ?? '',
  )
  const [attachments, setAttachments] =
    useState<readonly ChatAttachmentData[]>([])
  const [composerState, setComposerState] =
    useState<ChatComposerState>('idle')
  const [hasEarlier, setHasEarlier] = useState(true)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const sequenceRef = useRef(0)
  const attachmentSequenceRef = useRef(0)
  const timersRef = useRef<number[]>([])
  const failedOnceRef = useRef(false)
  const lastPayloadRef = useRef<ChatSubmitPayload | null>(null)

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer)
    timersRef.current = []
  }, [])

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((entry) => entry !== timer)
      callback()
    }, delay)
    timersRef.current.push(timer)
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const updateMessage = useCallback(
    (messageId: string, update: (message: ChatDemoMessage) => ChatDemoMessage) => {
      setMessages((current) => replaceMessage(current, messageId, update))
    },
    [],
  )

  const streamAnswer = useCallback(
    (
      messageId: string,
      partId: string,
      chunks: readonly string[],
      endingParts: readonly DemoPart[] = [],
    ) => {
      chunks.forEach((chunk, index) => {
        schedule(() => {
          updateMessage(messageId, (message) => appendText(message, partId, chunk))
          if (index === chunks.length - 1) {
            updateMessage(messageId, (message) => ({
              ...replacePart(message, partId, (part) => ({
                ...part,
                status: 'complete',
              })),
              status: 'complete',
              parts: [
                ...replacePart(message, partId, (part) => ({
                  ...part,
                  status: 'complete',
                })).parts,
                ...endingParts,
              ],
            }))
            setComposerState('idle')
          }
        }, STREAM_DELAY * (index + 1))
      })
    },
    [schedule, updateMessage],
  )

  const runStreamingScenario = useCallback(
    (messageId: string) => {
      schedule(() => {
        updateMessage(messageId, (message) => ({
          ...message,
          parts: [
            {
              ...message.parts[0]!,
              status: 'complete',
              durationMs: 420,
            },
            {
              id: `${messageId}-answer`,
              type: 'text',
              format: 'markdown',
              status: 'streaming',
              text: '',
            },
          ],
        }))
        streamAnswer(
          messageId,
          `${messageId}-answer`,
          [
            'A controlled composer keeps ',
            '**draft state** in the application ',
            'and reports submission as an intent. ',
            'That makes transport and persistence replaceable.\n\n',
            '```tsx\n',
            '<ChatComposer\n  value={draft}\n',
            '  onValueChange={setDraft}\n',
            '  onSubmit={handleSubmit}\n/>\n',
            '```',
          ],
          [
            {
              id: `${messageId}-sources`,
              type: 'sources',
              sources: [
                {
                  id: 'source-tint-contract',
                  title: 'Tint Chat — props & events',
                  description: 'Controlled props and object event payloads.',
                  url: '#/components/chat',
                },
                {
                  id: 'source-tint-accessibility',
                  title: 'Tint Chat — accessibility',
                  description: 'Keyboard, focus, and streaming guidance.',
                  url: '#/components/chat',
                },
              ],
            },
          ],
        )
      }, 420)
    },
    [schedule, streamAnswer, updateMessage],
  )

  const runResearchScenario = useCallback(
    (messageId: string) => {
      schedule(() => {
        updateMessage(messageId, (message) => ({
          ...message,
          parts: [
            {
              ...message.parts[0]!,
              status: 'complete',
              durationMs: 510,
            },
            {
              id: `${messageId}-tool`,
              type: 'tool',
              tool: {
                id: `${messageId}-local-search`,
                name: 'search_research_notes',
                title: 'Search local research notes',
                status: 'approval-required',
                input: {
                  query: 'accessible chat transcript patterns',
                  scope: '~/Vault (tint-chat-*)',
                },
                summary: 'Read the Tint research notes',
              },
            },
            {
              id: `${messageId}-approval`,
              type: 'approval',
              approval: {
                id: `${messageId}-approval-request`,
                toolId: `${messageId}-local-search`,
                title: 'Allow local research lookup?',
                description:
                  'This mock action only changes local fixture state; it does not read files or make a request.',
                status: 'pending',
                approveLabel: 'Allow lookup',
                denyLabel: 'Skip',
                allowReason: true,
              },
            },
          ],
        }))
      }, 510)
    },
    [schedule, updateMessage],
  )

  const runErrorScenario = useCallback(
    (messageId: string, recovered = false) => {
      schedule(() => {
        updateMessage(messageId, (message) => ({
          ...message,
          parts: [
            {
              ...message.parts[0]!,
              status: 'complete',
              durationMs: 320,
            },
            {
              id: `${messageId}-answer`,
              type: 'text',
              format: 'markdown',
              status: 'streaming',
              text: '',
            },
          ],
        }))

        if (recovered) {
          streamAnswer(messageId, `${messageId}-answer`, [
            'The retry succeeded. ',
            'Tint leaves recovery policy to the application ',
            'and only emits a typed `retry` action from the message.',
          ])
          return
        }

        const partial = ['The chat API is built around ', 'controlled messages and ']
        partial.forEach((chunk, index) => {
          schedule(() => {
            updateMessage(messageId, (message) =>
              appendText(message, `${messageId}-answer`, chunk),
            )
          }, STREAM_DELAY * (index + 1))
        })
        schedule(() => {
          updateMessage(messageId, (message) => ({
            ...message,
            status: 'error',
            parts: [
              ...replacePart(message, `${messageId}-answer`, (part) => ({
                ...part,
                status: 'error',
              })).parts,
              {
                id: `${messageId}-error`,
                type: 'error',
                status: 'error',
                message: 'The mocked response was interrupted.',
                code: 'DEMO_STREAM_INTERRUPTED',
                recoverable: true,
              },
            ],
          }))
          failedOnceRef.current = true
          setComposerState('error')
        }, STREAM_DELAY * (partial.length + 2))
      }, 320)
    },
    [schedule, streamAnswer, updateMessage],
  )

  const runAttachmentScenario = useCallback(
    (messageId: string, submittedAttachments: readonly ChatAttachmentData[]) => {
      schedule(() => {
        const attachmentNames =
          submittedAttachments.map((attachment) => attachment.name).join(', ') ||
          'the provided item'
        updateMessage(messageId, (message) => ({
          ...message,
          parts: [
            {
              ...message.parts[0]!,
              status: 'complete',
              durationMs: 460,
            },
            {
              id: `${messageId}-artifact`,
              type: 'artifact',
              kind: 'attachment-summary',
              title: 'Local analysis result',
              description: `Mocked metadata extracted from ${attachmentNames}.`,
              data: {
                files: Math.max(submittedAttachments.length, 1),
                transport: 'none',
                persisted: false,
                confidence: 0.94,
              },
            },
            {
              id: `${messageId}-answer`,
              type: 'text',
              format: 'markdown',
              status: 'streaming',
              text: '',
            },
          ],
        }))
        streamAnswer(messageId, `${messageId}-answer`, [
          'The attachment fixture is ready. ',
          'Its progress, metadata, and result were all generated in local React state—',
          '**no file was uploaded**.',
        ])
      }, 460)
    },
    [schedule, streamAnswer, updateMessage],
  )

  const runPreferenceScenario = useCallback(
    (messageId: string) => {
      schedule(() => {
        updateMessage(messageId, (message) => ({
          ...message,
          status: 'complete',
          parts: [
            {
              ...message.parts[0]!,
              status: 'complete',
              durationMs: 480,
              text: 'Drafted two candidate answers that reuse ordinary text and code parts.',
            },
            {
              id: `${messageId}-preference`,
              type: 'custom',
              kind: 'preference',
              data: {
                status: 'pending',
                options: [
                  {
                    id: `${messageId}-option-a`,
                    label: 'Response 1',
                    parts: [
                      {
                        id: `${messageId}-option-a-text`,
                        type: 'text',
                        format: 'markdown',
                        text:
                          'Use a **timeout ref** so each keystroke resets the wait before calling search.',
                      },
                      {
                        id: `${messageId}-option-a-code`,
                        type: 'code',
                        language: 'tsx',
                        filename: 'useDebouncedSearch.ts',
                        code: `function useDebouncedSearch(query: string) {
  const [results, setResults] = useState([])
  useEffect(() => {
    const id = window.setTimeout(() => {
      void search(query).then(setResults)
    }, 300)
    return () => window.clearTimeout(id)
  }, [query])
  return results
}`,
                      },
                    ],
                  },
                  {
                    id: `${messageId}-option-b`,
                    label: 'Response 2',
                    parts: [
                      {
                        id: `${messageId}-option-b-text`,
                        type: 'text',
                        format: 'markdown',
                        text:
                          'Wrap the fetch in a small **debounced callback** so the component stays declarative.',
                      },
                      {
                        id: `${messageId}-option-b-code`,
                        type: 'code',
                        language: 'tsx',
                        filename: 'SearchField.tsx',
                        code: `const runSearch = useDebouncedCallback((value: string) => {
  void search(value).then(setResults)
}, 300)

<input
  value={query}
  onChange={(event) => {
    setQuery(event.target.value)
    runSearch(event.target.value)
  }}
/>`,
                      },
                    ],
                  },
                ],
              },
            } satisfies PreferencePart,
          ],
        }))
        setComposerState('idle')
      }, 480)
    },
    [schedule, updateMessage],
  )

  const beginRun = useCallback(
    (
      payload: ChatSubmitPayload,
      options?: {
        baseMessages?: readonly ChatDemoMessage[]
        scenario?: ChatDemoScenarioId
      },
    ) => {
      clearTimers()
      sequenceRef.current += 1
      const sequence = sequenceRef.current
      const activeScenario = options?.scenario ?? scenarioId
      const humanId = `demo-user-${sequence}`
      const assistantId = `demo-assistant-${sequence}`
      const runTime = DEMO_BASE_TIME + sequence * 60_000
      const assistant = pendingAssistantMessage(
        assistantId,
        activeScenario === 'attachment'
          ? 'Inspecting attachment metadata'
          : activeScenario === 'preference'
            ? 'Preparing candidate responses'
            : 'Planning response',
        runTime + 1_000,
      )
      const next = [
        ...(options?.baseMessages ?? messages),
        userMessage(humanId, payload, runTime, replyTo?.id),
        assistant,
      ]

      lastPayloadRef.current = payload
      setMessages(next)
      setReplyTo(null)
      setDraft('')
      setAttachments([])
      setComposerState('streaming')
      setLoadingEarlier(false)

      if (activeScenario === 'research') runResearchScenario(assistantId)
      if (activeScenario === 'streaming') runStreamingScenario(assistantId)
      if (activeScenario === 'error') runErrorScenario(assistantId, failedOnceRef.current)
      if (activeScenario === 'attachment') {
        runAttachmentScenario(assistantId, payload.attachments)
      }
      if (activeScenario === 'preference') runPreferenceScenario(assistantId)
    },
    [
      clearTimers,
      messages,
      runAttachmentScenario,
      runErrorScenario,
      runPreferenceScenario,
      runResearchScenario,
      runStreamingScenario,
      scenarioId,
      replyTo,
    ],
  )

  const submit = useCallback(
    (payload: ChatSubmitPayload) => beginRun(payload),
    [beginRun],
  )

  const stop = useCallback(() => {
    clearTimers()
    setMessages((current) => {
      const streaming = [...current]
        .reverse()
        .find((message) => message.status === 'streaming')
      if (!streaming) return current
      return replaceMessage(current, streaming.id, (message) => ({
        ...message,
        status: 'stopped',
        parts: message.parts.map((part) =>
          part.status === 'streaming' ? { ...part, status: 'complete' } : part,
        ),
      }))
    })
    setComposerState('idle')
  }, [clearTimers])

  const retryMessage = useCallback(
    (messageId: string) => {
      clearTimers()
      setMessages((current) =>
        replaceMessage(current, messageId, (message) => ({
          ...pendingAssistantMessage(
            messageId,
            'Retrying response',
            typeof message.createdAt === 'number'
              ? message.createdAt
              : DEMO_BASE_TIME,
          ),
          createdAt: message.createdAt,
        })),
      )
      setComposerState('streaming')

      if (scenarioId === 'error') {
        failedOnceRef.current = true
        runErrorScenario(messageId, true)
      } else if (scenarioId === 'research') {
        runResearchScenario(messageId)
      } else if (scenarioId === 'attachment') {
        runAttachmentScenario(messageId, lastPayloadRef.current?.attachments ?? [])
      } else if (scenarioId === 'preference') {
        runPreferenceScenario(messageId)
      } else {
        runStreamingScenario(messageId)
      }
    },
    [
      clearTimers,
      runAttachmentScenario,
      runErrorScenario,
      runPreferenceScenario,
      runResearchScenario,
      runStreamingScenario,
      scenarioId,
    ],
  )

  const startReply = useCallback(
    (messageId: ChatId) => {
      const target = messages.find((message) => message.id === messageId)
      if (target) setReplyTo(target)
    },
    [messages],
  )

  const cancelReply = useCallback(() => setReplyTo(null), [])

  const messageAction = useCallback(
    (payload: ChatMessageActionPayload) => {
      if (payload.action === 'retry') retryMessage(payload.messageId)
      if (payload.action === 'reply') startReply(payload.messageId)
    },
    [retryMessage, startReply],
  )

  const selectPreference = useCallback(
    (messageId: ChatId, partId: ChatId, optionId: ChatId) => {
      updateMessage(messageId, (message) =>
        replacePart(message, partId, (part) => {
          if (part.type !== 'custom' || part.kind !== 'preference') return part
          if (part.data.status === 'selected') return part
          return {
            ...part,
            data: {
              ...part.data,
              status: 'selected',
              selectedOptionId: optionId,
            },
          }
        }),
      )
    },
    [updateMessage],
  )

  const toolApproval = useCallback(
    (payload: ChatToolApprovalPayload) => {
      clearTimers()
      updateMessage(payload.messageId, (message) => {
        const approvalPart = message.parts.find(
          (part) => part.id === payload.partId && part.type === 'approval',
        )
        const approvalToolId =
          approvalPart?.type === 'approval' ? approvalPart.approval.toolId : undefined

        return {
          ...message,
          parts: message.parts.map((part) => {
          if (part.id === payload.partId && part.type === 'approval') {
            return {
              ...part,
              approval: {
                ...part.approval,
                status: payload.approved ? 'approved' : 'denied',
              },
            }
          }
          if (part.type === 'tool' && part.tool.id === approvalToolId) {
            return {
              ...part,
              tool: {
                ...part.tool,
                status: payload.approved ? 'running' : 'cancelled',
                summary: payload.approved
                  ? 'Reading local fixture data'
                  : 'Lookup skipped by the user',
              },
            }
          }
          return part
        }),
        }
      })

      if (!payload.approved) {
        schedule(() => {
          updateMessage(payload.messageId, (message) => ({
            ...message,
            status: 'complete',
            parts: [
              ...message.parts,
              {
                id: `${payload.messageId}-denied-answer`,
                type: 'text',
                format: 'markdown',
                text:
                  'No problem—I skipped the lookup. The transcript remains usable because approval is represented as ordinary controlled message state.',
                status: 'complete',
              },
            ],
          }))
          setComposerState('idle')
        }, 260)
        return
      }

      schedule(() => {
        updateMessage(payload.messageId, (message) => ({
          ...message,
          parts: [
            ...message.parts.map((part) =>
              part.type === 'tool'
                ? {
                    ...part,
                    tool: {
                      ...part.tool,
                      status: 'succeeded' as const,
                      summary: 'Found three local accessibility patterns',
                      output: {
                        patterns: [
                          'sticky follow',
                          'roving transcript focus',
                          'deduplicated live announcements',
                        ],
                      },
                    },
                  }
                : part,
            ),
            {
              id: `${payload.messageId}-answer`,
              type: 'text',
              format: 'markdown',
              status: 'streaming',
              text: '',
            },
          ],
        }))
        streamAnswer(
          payload.messageId,
          `${payload.messageId}-answer`,
          [
            'The strongest transcript patterns are:\n\n',
            '1. Follow streaming output only while the reader is near the bottom.\n',
            '2. Preserve the viewport when older history is prepended.\n',
            '3. Announce state transitions without reading every token.\n',
            '4. Keep every interaction reachable by keyboard.',
          ],
          [
            {
              id: `${payload.messageId}-sources`,
              type: 'sources',
              sources: [
                {
                  id: 'source-a11y',
                  title: 'Tint Chat — accessibility',
                  description: 'Transcript focus and announcement guidance.',
                  url: '#/components/chat',
                },
                {
                  id: 'source-architecture',
                  title: 'Tint Chat — component reference',
                  description: 'Controlled presentation boundaries.',
                  url: '#/components/chat',
                },
              ],
            },
          ],
        )
      }, 620)
    },
    [clearTimers, schedule, streamAnswer, updateMessage],
  )

  const addAttachments = useCallback(
    (files: readonly File[]) => {
      const additions = files.map<ChatAttachmentData>((file, index) => ({
        id: `demo-attachment-${attachmentSequenceRef.current++}-${index}`,
        name: file.name,
        mediaType: file.type || 'application/octet-stream',
        size: file.size,
        uploadProgress: 0,
        status: 'uploading',
      }))
      setAttachments((current) => [...current, ...additions])

      for (const addition of additions) {
        const progressSteps = [35, 72, 100]
        progressSteps.forEach((progress, index) => {
          schedule(() => {
            setAttachments((current) =>
              current.map((attachment) =>
                attachment.id === addition.id
                  ? {
                      ...attachment,
                      uploadProgress: progress,
                      status: progress === 100 ? 'ready' : 'uploading',
                    }
                  : attachment,
              ),
            )
          }, 180 * (index + 1))
        })
      }
    },
    [schedule],
  )

  const removeAttachment = useCallback((attachmentId: string) => {
    setAttachments((current) =>
      current.filter((attachment) => attachment.id !== attachmentId),
    )
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    sequenceRef.current = 0
    attachmentSequenceRef.current = 0
    failedOnceRef.current = false
    lastPayloadRef.current = null
    setMessages(demoChannel.messages)
    setReplyTo(null)
    setAttachments([])
    setComposerState('idle')
    setHasEarlier(true)
    setLoadingEarlier(false)
    setDraft(
      chatDemoScenarios.find((scenario) => scenario.id === scenarioId)?.prompt ?? '',
    )
  }, [clearTimers, scenarioId])

  const replay = useCallback(() => {
    clearTimers()
    sequenceRef.current = 0
    attachmentSequenceRef.current = 0
    failedOnceRef.current = false
    setAttachments([])
    setHasEarlier(true)
    const prompt =
      chatDemoScenarios.find((scenario) => scenario.id === scenarioId)?.prompt ?? ''
    beginRun(
      { text: prompt, attachments: [] },
      { baseMessages: demoChannel.messages, scenario: scenarioId },
    )
  }, [beginRun, clearTimers, scenarioId])

  const setScenarioId = useCallback(
    (next: ChatDemoScenarioId) => {
      clearTimers()
      sequenceRef.current = 0
      attachmentSequenceRef.current = 0
      failedOnceRef.current = false
      setScenarioIdState(next)
      setMessages(demoChannel.messages)
      setReplyTo(null)
      setAttachments([])
      setComposerState('idle')
      setHasEarlier(true)
      setDraft(
        chatDemoScenarios.find((scenario) => scenario.id === next)?.prompt ?? '',
      )
    },
    [clearTimers],
  )

  const loadEarlier = useCallback(() => {
    if (!hasEarlier || loadingEarlier) return
    setLoadingEarlier(true)
    schedule(() => {
      setMessages((current) => [...earlierDemoMessages, ...current])
      setHasEarlier(false)
      setLoadingEarlier(false)
    }, 420)
  }, [hasEarlier, loadingEarlier, schedule])

  return {
    scenarioId,
    setScenarioId,
    scenarios: chatDemoScenarios,
    messages,
    draft,
    setDraft,
    attachments,
    composerState,
    hasEarlier,
    loadingEarlier,
    replyTo,
    cancelReply,
    submit,
    stop,
    messageAction,
    toolApproval,
    selectPreference,
    addAttachments,
    removeAttachment,
    loadEarlier,
    reset,
    replay,
  }
}
