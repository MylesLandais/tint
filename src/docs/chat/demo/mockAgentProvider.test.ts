import { describe, expect, it } from 'vitest'
import {
  MOCK_LLM_SERVICE,
  MOCK_TTS_SERVICE,
  createGroupTraceSession,
  demoGroupTrace,
} from './mockAgentProvider'

describe('mock group-chat provider', () => {
  it('emits one trace covering Maya and Jordan with cached TTS', () => {
    const session = createGroupTraceSession({
      sequence: 3,
      userText: 'introduce yourselves',
    })
    const user = session.afterUser()
    const maya = session.afterMaya()
    const full = session.afterJordan()

    expect(user.traceId).toBe('trc-group-3')
    expect(user.spans.map((span) => span.name)).toEqual(['conversation', 'user.message'])
    expect(maya.spans.some((span) => span.name === 'agent.maya')).toBe(true)
    expect(maya.spans.some((span) => span.name === 'agent.jordan')).toBe(false)

    const names = full.spans.map((span) => span.name)
    expect(names).toEqual([
      'conversation',
      'user.message',
      'agent.maya',
      'llm.generate',
      'tts.synthesize',
      'agent.jordan',
      'llm.generate',
      'tts.synthesize',
    ])
    expect(new Set(full.spans.map((span) => span.traceId))).toEqual(new Set([full.traceId]))
    expect(full.spans.filter((span) => span.service === MOCK_LLM_SERVICE)).toHaveLength(2)

    const tts = full.spans.filter((span) => span.service === MOCK_TTS_SERVICE)
    expect(tts.every((span) => span.attributes?.['tts.cache'] === 'hit')).toBe(true)
    expect(tts.every((span) => span.attributes?.['tts.src'] === '/audio/maya.wav')).toBe(true)
  })

  it('appends a replay span on the same trace without inventing a new conversation', () => {
    const session = createGroupTraceSession({ sequence: 1, userText: 'hi' })
    session.afterJordan()
    const replayed = session.recordReplay('maya')

    expect(replayed.traceId).toBe('trc-group-1')
    expect(replayed.spans.filter((span) => span.name === 'tts.replay')).toHaveLength(1)
    expect(replayed.spans.find((span) => span.name === 'tts.replay')?.parentSpanId).toBe(
      'sp-maya-1',
    )
  })

  it('builds the docs fixture from the same provider', () => {
    expect(demoGroupTrace().spans.some((span) => span.name === 'agent.jordan')).toBe(true)
  })
})
