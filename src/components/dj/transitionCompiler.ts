import type {
  AutomationLanePlan,
  CompiledTransition,
  DJTransition,
} from './contracts'

export function compileTransition(transition: DJTransition): CompiledTransition {
  validateTransition(transition)

  const durationBeats = transition.lengthBars * transition.beatsPerBar
  validateAutomation(transition.automation, durationBeats)
  const durationSeconds = (durationBeats * 60) / transition.bpm
  const midpoint = durationBeats / 2

  const lanes: Record<string, AutomationLanePlan> = {
    'outgoing.gain': {
      curve: 'equal-power-out',
      points: [
        { beat: 0, value: 1 },
        { beat: durationBeats, value: 0 },
      ],
    },
    'incoming.gain': {
      curve: 'equal-power-in',
      points: [
        { beat: 0, value: 0 },
        { beat: durationBeats, value: 1 },
      ],
    },
    'incoming.eqLow': {
      curve: 'step',
      points: [
        { beat: 0, value: 0 },
        { beat: midpoint, value: 0 },
        { beat: midpoint, value: 1 },
        { beat: durationBeats, value: 1 },
      ],
    },
  }

  if (transition.preset === 'filter-echo-exit') {
    lanes['outgoing.filterHighPass'] = {
      curve: 'linear',
      points: [
        { beat: 0, value: 0 },
        { beat: durationBeats, value: 1 },
      ],
    }
    lanes['outgoing.echoWet'] = {
      curve: 'linear',
      points: [
        { beat: 0, value: 0 },
        { beat: durationBeats, value: 0.35 },
      ],
    }
    lanes['outgoing.dry'] = {
      curve: 'step',
      points: [
        { beat: 0, value: 1 },
        { beat: durationBeats, value: 0 },
      ],
    }
  }

  return {
    transitionId: transition.id,
    startBeat: transition.startBeat,
    endBeat: transition.startBeat + durationBeats,
    durationBeats,
    durationSeconds,
    effectTailBeats: transition.preset === 'filter-echo-exit' ? 8 : 0,
    lanes: { ...lanes, ...transition.automation },
  }
}

function validateTransition(transition: DJTransition): void {
  const positiveFinite = [transition.bpm, transition.lengthBars, transition.beatsPerBar]
  if (positiveFinite.some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new RangeError('Tempo, bar length, and beats per bar must be positive finite values')
  }
  if (!Number.isFinite(transition.startBeat) || transition.startBeat < 0) {
    throw new RangeError('Transition start beat must be a non-negative finite value')
  }
  if (transition.startBeat % transition.beatsPerBar !== 0) {
    throw new RangeError('Transition must start on a bar boundary')
  }
}

function validateAutomation(
  automation: DJTransition['automation'],
  durationBeats: number,
): void {
  if (automation === undefined) return
  if (!isRecord(automation)) throw new TypeError('Transition automation must be an object')
  for (const [laneName, candidate] of Object.entries(automation)) {
    if (!isRecord(candidate)) throw new TypeError(`Automation lane ${laneName} must be an object`)
    if (!['linear', 'step', 'equal-power-in', 'equal-power-out'].includes(String(candidate.curve))) {
      throw new TypeError(`Automation lane ${laneName} has an unknown curve`)
    }
    if (!Array.isArray(candidate.points) || candidate.points.length === 0) {
      throw new TypeError(`Automation lane ${laneName} must contain points`)
    }
    let previousBeat = -1
    for (const point of candidate.points) {
      if (!isRecord(point)
        || typeof point.beat !== 'number'
        || typeof point.value !== 'number'
        || !Number.isFinite(point.beat)
        || !Number.isFinite(point.value)) {
        throw new TypeError(`Automation point in ${laneName} must contain finite numbers`)
      }
      if (point.beat < previousBeat || point.beat < 0 || point.beat > durationBeats) {
        throw new RangeError(`Automation point in ${laneName} is outside or out of order`)
      }
      previousBeat = point.beat
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
