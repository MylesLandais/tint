import { describe, expect, it } from 'vitest'
import {
  applyPolicyCommand,
  countMatches,
  matchEntry,
  mockDryRun,
  type PolicyDocument,
  type PolicyRule,
} from './contracts'
import { DEMO_FEED } from '../feed/fixtures'
import { DEMO_POLICY } from '../feed/fixtures'

const builderRule = DEMO_POLICY.rules[0]!

describe('matchEntry (builder)', () => {
  it('AND-matches every clause', () => {
    const entry = DEMO_FEED.entries.find((row) => row.id === 'entry-mk-1')!
    expect(matchEntry(entry, builderRule.criteria)).toBe(true)

    const miss = DEMO_FEED.entries.find((row) => row.id === 'entry-mk-2')!
    expect(matchEntry(miss, builderRule.criteria)).toBe(false)
  })

  it('requires at least one clause', () => {
    const entry = DEMO_FEED.entries[0]!
    expect(matchEntry(entry, { mode: 'builder', clauses: [] })).toBe(false)
  })
})

describe('mockDryRun', () => {
  it('runs builder clauses for real', () => {
    const entry = DEMO_FEED.entries.find((row) => row.id === 'entry-k2s-1')!
    const rule = DEMO_POLICY.rules.find((row) => row.id === 'pol-k2s-auto')!
    expect(mockDryRun(entry, rule)).toMatchObject({
      matched: true,
      disposition: 'auto_queue',
    })
  })

  it('returns a sandbox-error fixture for Lua containing error', () => {
    const entry = DEMO_FEED.entries[0]!
    const result = mockDryRun(entry, {
      enabled: true,
      disposition: 'notify_only',
      criteria: { mode: 'lua', source: 'error("boom")' },
    })
    expect(result.matched).toBe(false)
    expect(result.note).toMatch(/instruction limit/i)
  })

  it('counts builder matches over a fixture list', () => {
    expect(countMatches(DEMO_FEED.entries, builderRule)).toBe(2)
  })
})

describe('applyPolicyCommand', () => {
  it('creates, toggles, updates, and deletes without mutating the prior doc', () => {
    const base: PolicyDocument = { ...DEMO_POLICY, rules: [...DEMO_POLICY.rules] }
    const created: PolicyRule = {
      id: 'pol-new',
      sourceId: 'src-lobsters',
      name: 'New rule',
      enabled: true,
      criteria: { mode: 'builder', clauses: [] },
      disposition: 'notify_only',
      workflowEdge: 'notify',
      matchCount: 0,
    }

    const afterCreate = applyPolicyCommand(base, { type: 'policy.create', rule: created })
    expect(afterCreate).not.toBe(base)
    expect(afterCreate.rules).toHaveLength(base.rules.length + 1)
    expect(afterCreate.revision).not.toBe(base.revision)

    const afterToggle = applyPolicyCommand(afterCreate, {
      type: 'policy.toggle',
      ruleId: 'pol-new',
      enabled: false,
    })
    expect(afterToggle.rules.find((rule) => rule.id === 'pol-new')?.enabled).toBe(false)

    const afterUpdate = applyPolicyCommand(afterToggle, {
      type: 'policy.update',
      ruleId: 'pol-new',
      patch: { name: 'Renamed' },
    })
    expect(afterUpdate.rules.find((rule) => rule.id === 'pol-new')?.name).toBe('Renamed')

    const afterDelete = applyPolicyCommand(afterUpdate, {
      type: 'policy.delete',
      ruleId: 'pol-new',
    })
    expect(afterDelete.rules.some((rule) => rule.id === 'pol-new')).toBe(false)

    // Duplicate create is a no-op (same reference).
    expect(applyPolicyCommand(base, { type: 'policy.create', rule: base.rules[0]! })).toBe(base)
  })
})
