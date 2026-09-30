import { expect, it } from 'vitest'
import { eventReviewPeople, eventReviewTimestamp, toggleEventReviewPerson } from './eventReview'

it('keeps history dates separate from valid media offsets', () => {
  expect(eventReviewTimestamp(125.9)).toBe('2:05')
  expect(eventReviewTimestamp(-1)).toBeNull()
  expect(eventReviewTimestamp(Number.POSITIVE_INFINITY)).toBeNull()
})

it('keeps unknown selected candidates visible and removable', () => {
  expect(eventReviewPeople([{ id: 'known', label: 'Alex' }], ['missing'])).toEqual([
    { id: 'known', label: 'Alex' }, { id: 'missing', label: 'Unknown person (missing)' },
  ])
  expect(toggleEventReviewPerson(['known', 'missing'], 'missing', false)).toEqual(['known'])
  expect(toggleEventReviewPerson(['known'], 'known', true)).toEqual(['known'])
})
