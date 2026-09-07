import type {
  AutomationLanePlan,
  DJSetCommand,
  DJSetDocument,
  DJTrack,
  DJTransition,
  TransitionPreset,
} from './contracts'
import { compileTransition } from './transitionCompiler'

export function applyDJSetCommand(
  document: DJSetDocument,
  command: DJSetCommand,
): DJSetDocument {
  switch (command.type) {
    case 'tracks.reorder': {
      if (!isExactTrackOrder(document, command.trackIds)) return document
      if (command.trackIds.every((id, index) => document.trackIds[index] === id)) return document
      return commit(document, { trackIds: [...command.trackIds] })
    }
    case 'transitions.generateAuto': {
      const transitions = generateAutoTransitions(document)
      if (sameTransitions(document.transitions, transitions)) return document
      return commit(document, { transitions })
    }
    case 'transition.preset.update': {
      return updateTransition(document, command.transitionId, (transition) => {
        if (transition.preset === command.preset && transition.automation === undefined) return transition
        return { ...transition, preset: command.preset, automation: undefined }
      })
    }
    case 'transition.automationPoint.update': {
      if (!Number.isInteger(command.pointIndex) || command.pointIndex < 0) return document
      if (!Number.isFinite(command.point.beat) || !Number.isFinite(command.point.value)) return document
      return updateTransition(document, command.transitionId, (transition) => {
        const lane = compileTransition(transition).lanes[command.lane]
        if (!lane || command.pointIndex >= lane.points.length) return transition
        const points = lane.points.map((point, index) => (
          index === command.pointIndex ? command.point : point
        ))
        if (points.some((point, index) => index > 0 && point.beat < points[index - 1]!.beat)) {
          return transition
        }
        const automation: Record<string, AutomationLanePlan> = {
          ...transition.automation,
          [command.lane]: { ...lane, points },
        }
        return { ...transition, automation }
      })
    }
  }
}

export function generateAutoTransitions(document: DJSetDocument): readonly DJTransition[] {
  const byId = new Map(document.tracks.map((track) => [track.id, track]))
  const orderedTracks = document.trackIds.map((id) => byId.get(id)).filter(isDJTrack)
  if (orderedTracks.length !== document.trackIds.length) return []

  const transitions: DJTransition[] = []
  let trackStartBeat = 0

  for (let index = 0; index < orderedTracks.length - 1; index += 1) {
    const outgoing = orderedTracks[index]!
    const incoming = orderedTracks[index + 1]!
    const lengthBars = index === 0 ? 32 : 16
    const preset: TransitionPreset = index === 0 ? 'long-bass-swap' : 'filter-echo-exit'
    const durationBeats = snappedDurationBeats(
      outgoing.durationSeconds,
      document.bpm,
      document.beatsPerBar,
    )
    const transitionBeats = lengthBars * document.beatsPerBar
    const startBeat = trackStartBeat + Math.max(0, durationBeats - transitionBeats)

    transitions.push({
      id: `${outgoing.id}--${incoming.id}`,
      fromTrackId: outgoing.id,
      toTrackId: incoming.id,
      startBeat,
      lengthBars,
      beatsPerBar: document.beatsPerBar,
      bpm: document.bpm,
      preset,
    })

    trackStartBeat = startBeat
  }

  return transitions
}

function snappedDurationBeats(
  durationSeconds: number,
  bpm: number,
  beatsPerBar: number,
): number {
  const beats = (durationSeconds * bpm) / 60
  return Math.floor(beats / beatsPerBar) * beatsPerBar
}

function isDJTrack(track: DJTrack | undefined): track is DJTrack {
  return track !== undefined
}

function isExactTrackOrder(document: DJSetDocument, trackIds: readonly string[]): boolean {
  if (trackIds.length !== document.trackIds.length) return false
  if (new Set(trackIds).size !== trackIds.length) return false
  const expected = new Set(document.trackIds)
  return trackIds.every((id) => expected.has(id))
}

function sameTransitions(
  left: readonly DJTransition[],
  right: readonly DJTransition[],
): boolean {
  return left.length === right.length && left.every((transition, index) => {
    const candidate = right[index]
    return candidate !== undefined
      && transition.id === candidate.id
      && transition.startBeat === candidate.startBeat
      && transition.lengthBars === candidate.lengthBars
      && transition.preset === candidate.preset
  })
}

function commit(
  document: DJSetDocument,
  patch: Partial<Pick<DJSetDocument, 'trackIds' | 'transitions'>>,
): DJSetDocument {
  return {
    ...document,
    ...patch,
    revision: nextRevision(document.revision),
  }
}

function updateTransition(
  document: DJSetDocument,
  transitionId: string,
  update: (transition: DJTransition) => DJTransition,
): DJSetDocument {
  let changed = false
  const transitions = document.transitions.map((transition) => {
    if (transition.id !== transitionId) return transition
    const next = update(transition)
    if (next !== transition) changed = true
    return next
  })
  return changed ? commit(document, { transitions }) : document
}

function nextRevision(revision: string): string {
  const value = Number.parseInt(revision.replace(/\D/g, ''), 10)
  return `r${Number.isFinite(value) ? value + 1 : 1}`
}
