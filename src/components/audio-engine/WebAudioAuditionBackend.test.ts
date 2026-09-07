import { describe, expect, it, vi } from 'vitest'
import { compileTransition } from '../dj/transitionCompiler'
import { WebAudioAuditionBackend } from './WebAudioAuditionBackend'

function audioParam() {
  return {
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setValueCurveAtTime: vi.fn(),
  }
}

function node(extra: Record<string, unknown> = {}) {
  return { connect: vi.fn(), disconnect: vi.fn(), ...extra }
}

function contextFixture() {
  const sources: Array<ReturnType<typeof node> & {
    buffer: AudioBuffer | null
    start: ReturnType<typeof vi.fn>
    stop: ReturnType<typeof vi.fn>
  }> = []
  const gains: ReturnType<typeof node>[] = []
  const filters: ReturnType<typeof node>[] = []
  const delays: ReturnType<typeof node>[] = []
  const context = {
    currentTime: 10,
    state: 'suspended',
    destination: node(),
    resume: vi.fn(async () => undefined),
    createBufferSource: vi.fn(() => {
      const source = node({ buffer: null, start: vi.fn(), stop: vi.fn() }) as ReturnType<typeof node> & {
        buffer: AudioBuffer | null
        start: ReturnType<typeof vi.fn>
        stop: ReturnType<typeof vi.fn>
      }
      sources.push(source)
      return source
    }),
    createGain: vi.fn(() => {
      const gain = node({ gain: audioParam() })
      gains.push(gain)
      return gain
    }),
    createBiquadFilter: vi.fn(() => {
      const filter = node({ type: 'lowpass', frequency: audioParam(), gain: audioParam(), Q: audioParam() })
      filters.push(filter)
      return filter
    }),
    createDelay: vi.fn(() => {
      const delay = node({ delayTime: audioParam() })
      delays.push(delay)
      return delay
    }),
  }
  return { context, sources, gains, filters, delays }
}

const schedule = compileTransition({
  id: 'here-we-go--apapacho',
  fromTrackId: 'here-we-go',
  toTrackId: 'apapacho',
  startBeat: 0,
  lengthBars: 32,
  beatsPerBar: 4,
  bpm: 128,
  preset: 'long-bass-swap',
})

describe('WebAudioAuditionBackend', () => {
  it('builds two deck graphs and schedules compiled automation against decoded buffers', async () => {
    const fixture = contextFixture()
    const outgoing = { duration: 320 } as AudioBuffer
    const incoming = { duration: 391 } as AudioBuffer
    const backend = new WebAudioAuditionBackend({
      context: fixture.context as unknown as AudioContext,
      resolveBuffers: vi.fn(async () => ({ outgoing, incoming })),
      leadTimeSeconds: 0.05,
    })

    await backend.startAudition(schedule)

    expect(fixture.context.resume).toHaveBeenCalledOnce()
    expect(fixture.sources).toHaveLength(2)
    expect(fixture.sources[0]!.buffer).toBe(outgoing)
    expect(fixture.sources[1]!.buffer).toBe(incoming)
    expect(fixture.sources[0]!.start).toHaveBeenCalledWith(10.05, 260)
    expect(fixture.sources[1]!.start).toHaveBeenCalledWith(10.05, 0)
    expect(fixture.filters).toHaveLength(4)
    expect(fixture.delays).toHaveLength(2)
    expect(backend.getDiagnostics().scheduledAutomationEvents).toBe(6)
    expect(backend.getDiagnostics().contextState).toBe('suspended')
  })

  it('stops every active source and clears scheduled diagnostics', async () => {
    const fixture = contextFixture()
    const backend = new WebAudioAuditionBackend({
      context: fixture.context as unknown as AudioContext,
      resolveBuffers: async () => ({
        outgoing: { duration: 320 } as AudioBuffer,
        incoming: { duration: 391 } as AudioBuffer,
      }),
    })
    await backend.startAudition(schedule)
    await backend.stopAudition()

    expect(fixture.sources[0]!.stop).toHaveBeenLastCalledWith()
    expect(fixture.sources[1]!.stop).toHaveBeenLastCalledWith()
    expect(backend.getDiagnostics().scheduledAutomationEvents).toBe(0)
  })

  it('tears down a partial graph and reports unsupported compiled lanes', async () => {
    const fixture = contextFixture()
    const backend = new WebAudioAuditionBackend({
      context: fixture.context as unknown as AudioContext,
      resolveBuffers: async () => ({
        outgoing: { duration: 320 } as AudioBuffer,
        incoming: { duration: 391 } as AudioBuffer,
      }),
    })

    await expect(backend.startAudition({
      ...schedule,
      lanes: { ...schedule.lanes, 'outgoing.pitch': { curve: 'linear', points: [{ beat: 0, value: 1 }] } },
    })).rejects.toThrow(/Unsupported Web Audio automation lane/)
    expect(fixture.sources[0]!.stop).toHaveBeenCalled()
    expect(fixture.sources[1]!.stop).toHaveBeenCalled()
    expect(backend.getDiagnostics()).toMatchObject({
      scheduledAutomationEvents: 0,
      lastEngineError: 'Unsupported Web Audio automation lane: outgoing.pitch',
    })
  })
})
