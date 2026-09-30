import { describe, expect, it } from 'vitest'
import { clampPercent, formatTime, normalizePeaks, playbackProgress, pointerPercent, queueItemStatus } from './model'

describe('media model', () => {
  it('formats finite media time and guards unloaded durations', () => {
    expect(formatTime(125.9)).toBe('2:05')
    expect(formatTime(Number.POSITIVE_INFINITY)).toBe('0:00')
    expect(formatTime(Number.NaN)).toBe('0:00')
  })

  it('converts pointer coordinates with a bottom-up vertical range', () => {
    expect(pointerPercent(25, 0, 100)).toBe(25)
    expect(pointerPercent(25, 0, 100, 'vertical')).toBe(75)
    expect(pointerPercent(200, 0, 100)).toBe(100)
    expect(pointerPercent(25, 0, 0)).toBe(0)
  })

  it('normalizes peaks and progress without leaking non-finite values', () => {
    expect(normalizePeaks([0, 2, 4, Number.NaN])).toEqual([0, 0.5, 1, 0])
    expect(playbackProgress(15, 60)).toBe(25)
    expect(playbackProgress(8, Number.NaN)).toBe(0)
    expect(clampPercent(Number.NaN)).toBe(0)
  })

  it('derives queue labels from host-owned current item and status', () => {
    expect(queueItemStatus(0, 1, 'paused')).toBe('Played')
    expect(queueItemStatus(1, 1, 'paused')).toBe('Paused')
    expect(queueItemStatus(2, 1, 'paused')).toBe('Up next')
  })
})
