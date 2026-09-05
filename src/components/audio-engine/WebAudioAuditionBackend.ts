import type { AutomationLanePlan, CompiledTransition } from '../dj/contracts'
import { scheduleAutomationLane } from './automationScheduler'
import type { AudioEngineBackend, AudioEngineDiagnostics } from './store'

export type AuditionBuffers = {
  outgoing: AudioBuffer
  incoming: AudioBuffer
}

export type WebAudioAuditionBackendOptions = {
  context: AudioContext
  resolveBuffers: (transitionId: string) => Promise<AuditionBuffers>
  leadTimeSeconds?: number
}

type DeckGraph = {
  source: AudioBufferSourceNode
  nodes: AudioNode[]
  targets: Record<string, AudioParam>
}

export class WebAudioAuditionBackend implements AudioEngineBackend {
  readonly #context: AudioContext
  readonly #resolveBuffers: WebAudioAuditionBackendOptions['resolveBuffers']
  readonly #leadTimeSeconds: number
  #activeGraphs: DeckGraph[] = []
  #scheduledAutomationEvents = 0
  #lastEngineError: string | undefined

  constructor({ context, resolveBuffers, leadTimeSeconds = 0.02 }: WebAudioAuditionBackendOptions) {
    if (!Number.isFinite(leadTimeSeconds) || leadTimeSeconds < 0) {
      throw new RangeError('Audio audition lead time must be finite and non-negative')
    }
    this.#context = context
    this.#resolveBuffers = resolveBuffers
    this.#leadTimeSeconds = leadTimeSeconds
  }

  async startAudition(schedule: CompiledTransition): Promise<void> {
    await this.stopAudition()
    try {
      const buffers = await this.#resolveBuffers(schedule.transitionId)
      if (this.#context.state === 'suspended') await this.#context.resume()
      const startTime = this.#context.currentTime + this.#leadTimeSeconds
      const outgoing = this.#createDeckGraph(buffers.outgoing)
      const incoming = this.#createDeckGraph(buffers.incoming)
      this.#activeGraphs = [outgoing, incoming]
      this.#scheduledAutomationEvents = this.#scheduleLanes(schedule, outgoing, incoming, startTime)

      const outgoingOffset = Math.max(0, buffers.outgoing.duration - schedule.durationSeconds)
      outgoing.source.start(startTime, outgoingOffset)
      incoming.source.start(startTime, 0)
      const bpm = deriveBpm(schedule)
      const stopTime = startTime + schedule.durationSeconds + schedule.effectTailBeats * 60 / bpm
      outgoing.source.stop(stopTime)
      incoming.source.stop(stopTime)
      this.#lastEngineError = undefined
    } catch (error) {
      await this.stopAudition()
      this.#lastEngineError = error instanceof Error ? error.message : 'Web Audio audition failed'
      throw error
    }
  }

  async stopAudition(): Promise<void> {
    for (const graph of this.#activeGraphs) {
      try {
        graph.source.stop()
      } catch {
        // A source may already have ended; graph teardown must remain idempotent.
      }
      graph.nodes.forEach((node) => node.disconnect())
    }
    this.#activeGraphs = []
    this.#scheduledAutomationEvents = 0
  }

  getDiagnostics(): AudioEngineDiagnostics {
    return {
      contextState: this.#context.state,
      scheduledAutomationEvents: this.#scheduledAutomationEvents,
      beatAlignmentErrorMs: 0,
      peakDbfs: Number.NEGATIVE_INFINITY,
      rmsDbfs: Number.NEGATIVE_INFINITY,
      droppedWorkletBlocks: 0,
      invalidParameterValues: 0,
      ...(this.#lastEngineError ? { lastEngineError: this.#lastEngineError } : {}),
    }
  }

  #createDeckGraph(buffer: AudioBuffer): DeckGraph {
    const source = this.#context.createBufferSource()
    source.buffer = buffer
    const eqLow = this.#context.createBiquadFilter()
    eqLow.type = 'lowshelf'
    eqLow.frequency.value = 200
    const highPass = this.#context.createBiquadFilter()
    highPass.type = 'highpass'
    const dry = this.#context.createGain()
    const deckGain = this.#context.createGain()
    const delay = this.#context.createDelay(2)
    delay.delayTime.value = 0.375
    const echoWet = this.#context.createGain()
    echoWet.gain.value = 0

    source.connect(eqLow)
    eqLow.connect(highPass)
    highPass.connect(dry)
    dry.connect(deckGain)
    deckGain.connect(this.#context.destination)
    highPass.connect(delay)
    delay.connect(echoWet)
    echoWet.connect(this.#context.destination)

    return {
      source,
      nodes: [source, eqLow, highPass, dry, deckGain, delay, echoWet],
      targets: {
        gain: deckGain.gain,
        eqLow: eqLow.gain,
        filterHighPass: highPass.frequency,
        dry: dry.gain,
        echoWet: echoWet.gain,
      },
    }
  }

  #scheduleLanes(
    schedule: CompiledTransition,
    outgoing: DeckGraph,
    incoming: DeckGraph,
    startTime: number,
  ): number {
    const bpm = deriveBpm(schedule)
    let events = 0
    for (const [name, lane] of Object.entries(schedule.lanes)) {
      const [deckName, parameterName] = name.split('.')
      const graph = deckName === 'outgoing' ? outgoing : deckName === 'incoming' ? incoming : undefined
      const parameter = graph?.targets[parameterName ?? '']
      if (!parameter) throw new RangeError(`Unsupported Web Audio automation lane: ${name}`)
      events += scheduleAutomationLane(parameter, mapLane(parameterName!, lane), { startTime, bpm })
    }
    return events
  }
}

function deriveBpm(schedule: CompiledTransition): number {
  const bpm = schedule.durationBeats * 60 / schedule.durationSeconds
  if (!Number.isFinite(bpm) || bpm <= 0) throw new RangeError('Compiled transition has invalid timing')
  return bpm
}

function mapLane(parameterName: string, lane: AutomationLanePlan): AutomationLanePlan {
  if (parameterName === 'eqLow') {
    return { ...lane, points: lane.points.map((point) => ({ ...point, value: -24 + point.value * 24 })) }
  }
  if (parameterName === 'filterHighPass') {
    return {
      ...lane,
      points: lane.points.map((point) => ({
        ...point,
        value: 20 * Math.pow(600, point.value),
      })),
    }
  }
  return lane
}
