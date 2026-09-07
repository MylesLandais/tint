import { describe, expect, it, vi } from 'vitest'
import { scheduleAutomationLane } from './automationScheduler'

function parameter() {
  return {
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    setValueCurveAtTime: vi.fn(),
  }
}

describe('scheduleAutomationLane', () => {
  it('converts beat-relative linear points to AudioContext time', () => {
    const target = parameter()
    const count = scheduleAutomationLane(target, {
      curve: 'linear',
      points: [{ beat: 0, value: 0 }, { beat: 64, value: 1 }],
    }, { startTime: 2, bpm: 128 })

    expect(target.cancelScheduledValues).toHaveBeenCalledWith(2)
    expect(target.setValueAtTime).toHaveBeenCalledWith(0, 2)
    expect(target.linearRampToValueAtTime).toHaveBeenCalledWith(1, 32)
    expect(count).toBe(2)
  })

  it('preserves step changes and uses a sampled equal-power curve', () => {
    const step = parameter()
    expect(scheduleAutomationLane(step, {
      curve: 'step',
      points: [{ beat: 0, value: 0 }, { beat: 32, value: 0 }, { beat: 32, value: 1 }],
    }, { startTime: 1, bpm: 120 })).toBe(3)
    expect(step.setValueAtTime).toHaveBeenNthCalledWith(3, 1, 17)

    const equalPower = parameter()
    expect(scheduleAutomationLane(equalPower, {
      curve: 'equal-power-in',
      points: [{ beat: 0, value: 0 }, { beat: 16, value: 1 }],
    }, { startTime: 4, bpm: 120 })).toBe(1)
    const [values, startTime, duration] = equalPower.setValueCurveAtTime.mock.calls[0]!
    expect(values).toBeInstanceOf(Float32Array)
    expect(values[0]).toBeCloseTo(0)
    expect(values.at(-1)).toBeCloseTo(1)
    expect(startTime).toBe(4)
    expect(duration).toBe(8)
  })

  it('rejects invalid timing before scheduling the parameter', () => {
    const target = parameter()
    expect(() => scheduleAutomationLane(target, {
      curve: 'linear',
      points: [{ beat: 0, value: Number.NaN }],
    }, { startTime: 0, bpm: 128 })).toThrow(/finite/)
    expect(target.setValueAtTime).not.toHaveBeenCalled()
  })
})
