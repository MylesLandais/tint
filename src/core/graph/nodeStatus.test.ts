import { expect, it } from 'vitest'
import { resolveNodeStatus, nodeStatusLabel } from './nodeStatus'
for (const status of ['unknown', 'cancelled'] as const) {
 it(`preserves ${status} runtime evidence rather than readiness or validation fallback`, () => {
  expect(resolveNodeStatus([], {status})).toBe(status)
  expect(resolveNodeStatus([{code:'draft',message:'Draft is invalid',severity:'error'}], {status})).toBe(status)
  expect(nodeStatusLabel(status)).toBe(status.toUpperCase())
 })
}
it('keeps readiness only for absent runtime evidence and retains existing queue/success states', () => {
 expect(resolveNodeStatus([], undefined)).toBe('ready')
 expect(resolveNodeStatus([], {status:'idle'})).toBe('idle')
 expect(resolveNodeStatus([], {status:'succeeded'})).toBe('succeeded')
})
