import { describe, expect, it } from 'vitest'
import {
  addPolicyClause, criteriaForMode, DEFAULT_LUA_SOURCE, newPolicyClause,
  removePolicyClause, updatePolicyClause, withPolicyRule,
} from './editor'
import type { PolicyRule } from './contracts'

const rule: PolicyRule = {
  id: 'rule', sourceId: 'source', name: 'Rule', enabled: true,
  criteria: { mode: 'builder', clauses: [newPolicyClause('c-1')] },
  disposition: 'notify_only', workflowEdge: 'notify', matchCount: 0,
}

describe('policy editor projection', () => {
  it('changes criteria mode without executing Lua and preserves existing clauses', () => {
    const lua = criteriaForMode(rule.criteria, 'lua', 'unused')
    expect(lua).toEqual({ mode: 'lua', source: DEFAULT_LUA_SOURCE })
    expect(criteriaForMode(lua, 'builder', 'c-2')).toEqual({ mode: 'builder', clauses: [newPolicyClause('c-2')] })
    expect(criteriaForMode(rule.criteria, 'builder', 'unused')).toEqual(rule.criteria)
  })

  it('adds, edits, and removes clauses immutably while preserving one required clause', () => {
    if (rule.criteria.mode !== 'builder') throw new Error('fixture')
    const added = addPolicyClause(rule.criteria, 'c-2')
    if (added.mode !== 'builder') throw new Error('builder')
    const edited = updatePolicyClause(added, 'c-2', { value: 'needle', field: 'tags' })
    if (edited.mode !== 'builder') throw new Error('builder')
    expect(edited.clauses[1]).toEqual({ id: 'c-2', field: 'tags', operator: 'contains', value: 'needle' })
    expect(removePolicyClause(edited, 'c-2')).toEqual(rule.criteria)
    expect(removePolicyClause(rule.criteria, 'c-1')).toBe(rule.criteria)
    expect(rule.criteria.clauses).toHaveLength(1)
    expect(withPolicyRule(rule, { name: 'Renamed' })).toMatchObject({ id: 'rule', name: 'Renamed' })
    expect(rule.name).toBe('Rule')
  })
})
