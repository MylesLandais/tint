import type { TelemetrySpan, TelemetryTrace } from '../../../components/telemetry'
import { MAYA_TTS_SRC, MAYA_TRANSCRIPT, JORDAN_TRANSCRIPT } from './scenarios'

export const MOCK_CHAT_SERVICE = 'tint.chat'
export const MOCK_MAYA_SERVICE = 'agent.maya'
export const MOCK_JORDAN_SERVICE = 'agent.jordan'
export const MOCK_LLM_SERVICE = 'mock.llm'
export const MOCK_TTS_SERVICE = 'mock.tts'
export const MOCK_CHAT_MODEL = 'mock-qwen-chat'
export const MOCK_TTS_MODEL = 'mock-qwen3-tts'

/** Wall-clock offsets matching the group demo's local timers. */
const TIMING = {
  userEnd: 18,
  mayaStart: 40,
  mayaLlmEnd: 528,
  mayaTtsEnd: 568,
  jordanStart: 748,
  jordanLlmEnd: 1196,
  jordanTtsEnd: 1236,
} as const

export type MockGroupAgent = 'maya' | 'jordan'

export type GroupTraceSession = {
  traceId: string
  afterUser(): TelemetryTrace
  afterMaya(): TelemetryTrace
  afterJordan(): TelemetryTrace
  recordReplay(agent: MockGroupAgent): TelemetryTrace
}

function span(partial: Omit<TelemetrySpan, 'traceId' | 'kind' | 'status'> & {
  traceId: string
  kind?: TelemetrySpan['kind']
  status?: TelemetrySpan['status']
}): TelemetrySpan {
  return {
    kind: 'internal',
    status: 'ok',
    ...partial,
  }
}

function conversation(traceId: string, sequence: number, endMs: number): TelemetrySpan {
  return span({
    traceId,
    spanId: `sp-conv-${sequence}`,
    name: 'conversation',
    service: MOCK_CHAT_SERVICE,
    kind: 'server',
    startMs: 0,
    endMs,
    attributes: {
      'chat.scenario': 'group',
      'chat.sequence': sequence,
    },
  })
}

function userSpan(traceId: string, sequence: number, userText: string): TelemetrySpan {
  return span({
    traceId,
    spanId: `sp-user-${sequence}`,
    parentSpanId: `sp-conv-${sequence}`,
    name: 'user.message',
    service: MOCK_CHAT_SERVICE,
    kind: 'consumer',
    startMs: 0,
    endMs: TIMING.userEnd,
    attributes: { 'chat.actor': 'human' },
    input: { text: userText },
  })
}

function agentTree(
  traceId: string,
  sequence: number,
  agent: MockGroupAgent,
  timing: { start: number; llmEnd: number; ttsEnd: number },
  output: string,
): TelemetrySpan[] {
  const service = agent === 'maya' ? MOCK_MAYA_SERVICE : MOCK_JORDAN_SERVICE
  const prefix = agent === 'maya' ? 'maya' : 'jordan'
  return [
    span({
      traceId,
      spanId: `sp-${prefix}-${sequence}`,
      parentSpanId: `sp-conv-${sequence}`,
      name: `agent.${agent}`,
      service,
      kind: 'internal',
      startMs: timing.start,
      endMs: timing.ttsEnd,
      attributes: { 'chat.actor': agent },
    }),
    span({
      traceId,
      spanId: `sp-${prefix}-llm-${sequence}`,
      parentSpanId: `sp-${prefix}-${sequence}`,
      name: 'llm.generate',
      service: MOCK_LLM_SERVICE,
      kind: 'client',
      startMs: timing.start,
      endMs: timing.llmEnd,
      attributes: {
        'gen_ai.system': 'mock',
        'gen_ai.request.model': MOCK_CHAT_MODEL,
        'gen_ai.usage.input_tokens': 48,
        'gen_ai.usage.output_tokens': agent === 'maya' ? 42 : 56,
      },
      input: { messages: [{ role: 'user', content: 'introduce yourself' }] },
      output: { text: output },
    }),
    span({
      traceId,
      spanId: `sp-${prefix}-tts-${sequence}`,
      parentSpanId: `sp-${prefix}-${sequence}`,
      name: 'tts.synthesize',
      service: MOCK_TTS_SERVICE,
      kind: 'client',
      startMs: timing.llmEnd,
      endMs: timing.ttsEnd,
      attributes: {
        'tts.model': MOCK_TTS_MODEL,
        'tts.cache': 'hit',
        'tts.src': MAYA_TTS_SRC,
        'tts.voice': agent,
      },
      input: { text: output },
      output: { src: MAYA_TTS_SRC, cached: true },
      events: [
        {
          name: 'tts.cache.lookup',
          timeMs: timing.llmEnd + 4,
          attributes: { hit: true },
        },
      ],
    }),
  ]
}

function assemble(
  name: string,
  spans: TelemetrySpan[],
): TelemetryTrace {
  return {
    traceId: spans[0]!.traceId,
    name,
    spans,
  }
}

/**
 * Deterministic mock provider for the group-chat demo. One `traceId` covers the
 * user turn plus Maya and Jordan (LLM then cached TTS). Nothing is fetched.
 */
export function createGroupTraceSession(options: {
  sequence: number
  userText: string
}): GroupTraceSession {
  const { sequence, userText } = options
  const traceId = `trc-group-${sequence}`
  const name = 'Group conversation'
  let replays = 0

  const user = userSpan(traceId, sequence, userText)
  const maya = agentTree(traceId, sequence, 'maya', {
    start: TIMING.mayaStart,
    llmEnd: TIMING.mayaLlmEnd,
    ttsEnd: TIMING.mayaTtsEnd,
  }, MAYA_TRANSCRIPT)
  const jordan = agentTree(traceId, sequence, 'jordan', {
    start: TIMING.jordanStart,
    llmEnd: TIMING.jordanLlmEnd,
    ttsEnd: TIMING.jordanTtsEnd,
  }, JORDAN_TRANSCRIPT)

  const replaySpans: TelemetrySpan[] = []
  let phase: 'user' | 'maya' | 'jordan' = 'user'

  const extraForPhase = () => {
    if (phase === 'jordan') return [...maya, ...jordan]
    if (phase === 'maya') return maya
    return []
  }

  const snapshot = (endMs: number, extra: readonly TelemetrySpan[]) =>
    assemble(name, [
      conversation(traceId, sequence, endMs),
      user,
      ...extra,
      ...replaySpans,
    ])

  return {
    traceId,
    afterUser: () => {
      phase = 'user'
      return snapshot(TIMING.userEnd, [])
    },
    afterMaya: () => {
      phase = 'maya'
      return snapshot(TIMING.mayaTtsEnd, maya)
    },
    afterJordan: () => {
      phase = 'jordan'
      return snapshot(TIMING.jordanTtsEnd, [...maya, ...jordan])
    },
    recordReplay(agent) {
      replays += 1
      const startMs =
        (phase === 'jordan' ? TIMING.jordanTtsEnd : phase === 'maya' ? TIMING.mayaTtsEnd : TIMING.userEnd) +
        replays * 48
      replaySpans.push(
        span({
          traceId,
          spanId: `sp-${agent}-tts-replay-${sequence}-${replays}`,
          parentSpanId: `sp-${agent}-${sequence}`,
          name: 'tts.replay',
          service: MOCK_TTS_SERVICE,
          kind: 'client',
          startMs,
          endMs: startMs + 36,
          attributes: {
            'tts.model': MOCK_TTS_MODEL,
            'tts.cache': 'hit',
            'tts.src': MAYA_TTS_SRC,
            'tts.voice': agent,
          },
        }),
      )
      const last = replaySpans[replaySpans.length - 1]!
      return snapshot(last.endMs, extraForPhase())
    },
  }
}

/** Finished group trace for the telemetry docs preview. */
export function demoGroupTrace(): TelemetryTrace {
  return createGroupTraceSession({
    sequence: 1,
    userText: 'Maya, introduce yourself — then Jordan, add a beat.',
  }).afterJordan()
}
