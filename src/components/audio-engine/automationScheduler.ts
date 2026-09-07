import type { AutomationLanePlan } from '../dj/contracts'

export type SchedulableAudioParam = Pick<
  AudioParam,
  'cancelScheduledValues' | 'setValueAtTime' | 'linearRampToValueAtTime' | 'setValueCurveAtTime'
>

export type AutomationScheduleTiming = {
  startTime: number
  bpm: number
}

export function scheduleAutomationLane(
  parameter: SchedulableAudioParam,
  lane: AutomationLanePlan,
  timing: AutomationScheduleTiming,
): number {
  validate(lane, timing)
  const secondsPerBeat = 60 / timing.bpm
  const timeAt = (beat: number) => timing.startTime + beat * secondsPerBeat
  parameter.cancelScheduledValues(timing.startTime)

  if (lane.curve === 'equal-power-in' || lane.curve === 'equal-power-out') {
    const first = lane.points[0]!
    const last = lane.points.at(-1)!
    const values = new Float32Array(65)
    for (let index = 0; index < values.length; index += 1) {
      const progress = index / (values.length - 1)
      const shaped = lane.curve === 'equal-power-in'
        ? Math.sin(progress * Math.PI / 2)
        : Math.cos(progress * Math.PI / 2)
      values[index] = first.value + (last.value - first.value) * shaped
    }
    parameter.setValueCurveAtTime(
      values,
      timeAt(first.beat),
      (last.beat - first.beat) * secondsPerBeat,
    )
    return 1
  }

  lane.points.forEach((point, index) => {
    if (lane.curve === 'linear' && index > 0) {
      parameter.linearRampToValueAtTime(point.value, timeAt(point.beat))
    } else {
      parameter.setValueAtTime(point.value, timeAt(point.beat))
    }
  })
  return lane.points.length
}

function validate(lane: AutomationLanePlan, timing: AutomationScheduleTiming): void {
  if (!Number.isFinite(timing.startTime) || timing.startTime < 0
    || !Number.isFinite(timing.bpm) || timing.bpm <= 0) {
    throw new RangeError('Automation schedule timing must contain finite positive values')
  }
  if (lane.points.length === 0) throw new RangeError('Automation lane must contain points')
  lane.points.forEach((point, index) => {
    if (!Number.isFinite(point.beat) || !Number.isFinite(point.value) || point.beat < 0) {
      throw new RangeError('Automation points must contain finite values')
    }
    if (index > 0 && point.beat < lane.points[index - 1]!.beat) {
      throw new RangeError('Automation points must be ordered by beat')
    }
  })
  if ((lane.curve === 'equal-power-in' || lane.curve === 'equal-power-out')
    && lane.points.at(-1)!.beat <= lane.points[0]!.beat) {
    throw new RangeError('Equal-power automation must span a positive duration')
  }
}
