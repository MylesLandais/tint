import { describe, expect, it } from 'vitest'
import { addToast, createToastRecord, removeToast, visibleToasts } from './model'

describe('toast queue model', () => {
  it('normalizes defaults and keeps the newest entries visible', () => {
    const first = createToastRecord('one', { title: 'First' })
    const second = createToastRecord('two', { title: 'Second', tone: 'danger', durationMs: 0 })
    const queue = addToast(addToast([], first), second)
    expect(first).toMatchObject({ tone: 'neutral', durationMs: 4000 })
    expect(second).toMatchObject({ tone: 'danger', durationMs: 0 })
    expect(visibleToasts(queue, 1).map((toast) => toast.id)).toEqual(['two'])
    expect(visibleToasts(removeToast(queue, 'two'), 1).map((toast) => toast.id)).toEqual(['one'])
    expect(visibleToasts(queue, 0)).toEqual([])
  })
})
