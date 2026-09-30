import type { AuditionBuffers } from './WebAudioAuditionBackend'
import type { DJTransition } from '../dj/contracts'

type TransitionBinding = {
  outgoingTrackId: string
  incomingTrackId: string
}

export class AudioBufferRegistry {
  readonly #tracks = new Map<string, AudioBuffer>()
  readonly #transitions = new Map<string, TransitionBinding>()

  registerTrack(trackId: string, buffer: AudioBuffer): void {
    assertId(trackId, 'Track')
    if (this.#tracks.has(trackId)) throw new Error(`Track already registered: ${trackId}`)
    this.#tracks.set(trackId, buffer)
  }

  removeTrack(trackId: string): boolean {
    return this.#tracks.delete(trackId)
  }

  hasTrack(trackId: string): boolean {
    return this.#tracks.has(trackId)
  }

  bindTransition(transitionId: string, outgoingTrackId: string, incomingTrackId: string): void {
    assertId(transitionId, 'Transition')
    if (!this.#tracks.has(outgoingTrackId)) throw new Error(`Transition outgoing track is missing: ${outgoingTrackId}`)
    if (!this.#tracks.has(incomingTrackId)) throw new Error(`Transition incoming track is missing: ${incomingTrackId}`)
    this.#transitions.set(transitionId, { outgoingTrackId, incomingTrackId })
  }

  async resolveTransition(transitionId: string): Promise<AuditionBuffers> {
    const binding = this.#transitions.get(transitionId)
    if (!binding) throw new Error(`Transition is not bound: ${transitionId}`)
    const outgoing = this.#tracks.get(binding.outgoingTrackId)
    const incoming = this.#tracks.get(binding.incomingTrackId)
    if (!outgoing) throw new Error(`Transition outgoing track is missing: ${binding.outgoingTrackId}`)
    if (!incoming) throw new Error(`Transition incoming track is missing: ${binding.incomingTrackId}`)
    return { outgoing, incoming }
  }
}

export function bindDJSetTransitions(
  registry: AudioBufferRegistry,
  transitions: readonly DJTransition[],
): void {
  const transitionIds = new Set<string>()
  for (const transition of transitions) {
    assertId(transition.id, 'Transition')
    if (transitionIds.has(transition.id)) {
      throw new Error(`Duplicate transition binding: ${transition.id}`)
    }
    transitionIds.add(transition.id)
    if (!registry.hasTrack(transition.fromTrackId)) {
      throw new Error(`Transition outgoing track is missing: ${transition.fromTrackId}`)
    }
    if (!registry.hasTrack(transition.toTrackId)) {
      throw new Error(`Transition incoming track is missing: ${transition.toTrackId}`)
    }
  }
  for (const transition of transitions) {
    registry.bindTransition(transition.id, transition.fromTrackId, transition.toTrackId)
  }
}

function assertId(id: string, label: string): void {
  if (id.trim().length === 0) throw new RangeError(`${label} ID must not be empty`)
}
