import type {
  MatchClause, MatchCriteria, MatchField, MatchOperator, PolicyDisposition,
  PolicyRule, WorkflowEdge,
} from './contracts'

export const POLICY_FIELDS: readonly MatchField[] = ['title', 'excerpt', 'tags', 'url', 'contentKind']
export const POLICY_OPERATORS: readonly MatchOperator[] = ['contains', 'equals', 'starts_with', 'includes_tag']
export const POLICY_DISPOSITIONS: readonly PolicyDisposition[] = ['notify_only', 'notify_and_cache', 'auto_queue']
export const POLICY_EDGES: readonly WorkflowEdge[] = ['feed_write', 'notify', 'intent_create']
export const DEFAULT_LUA_SOURCE = '-- Demo only: not executed in the browser\nreturn true'

export function newPolicyClause(id: string): MatchClause {
  return { id, field: 'title', operator: 'contains', value: '' }
}

export function withPolicyRule(rule: PolicyRule, patch: Partial<Omit<PolicyRule, 'id'>>): PolicyRule {
  return { ...rule, ...patch, id: rule.id }
}

export function withPolicyCriteria(rule: PolicyRule, criteria: MatchCriteria): PolicyRule {
  return withPolicyRule(rule, { criteria })
}

export function criteriaForMode(criteria: MatchCriteria, mode: MatchCriteria['mode'], clauseId: string): MatchCriteria {
  if (mode === 'lua') return { mode: 'lua', source: criteria.mode === 'lua' ? criteria.source : DEFAULT_LUA_SOURCE }
  return { mode: 'builder', clauses: criteria.mode === 'builder' && criteria.clauses.length > 0 ? criteria.clauses : [newPolicyClause(clauseId)] }
}

export function addPolicyClause(criteria: Extract<MatchCriteria, { mode: 'builder' }>, id: string): MatchCriteria {
  return { mode: 'builder', clauses: [...criteria.clauses, newPolicyClause(id)] }
}

export function updatePolicyClause(criteria: Extract<MatchCriteria, { mode: 'builder' }>, id: string, patch: Partial<Omit<MatchClause, 'id'>>): MatchCriteria {
  return { mode: 'builder', clauses: criteria.clauses.map((clause) => clause.id === id ? { ...clause, ...patch, id } : clause) }
}

export function removePolicyClause(criteria: Extract<MatchCriteria, { mode: 'builder' }>, id: string): MatchCriteria {
  return criteria.clauses.length <= 1 ? criteria : { mode: 'builder', clauses: criteria.clauses.filter((clause) => clause.id !== id) }
}

export const POLICY_DISPOSITION_TONES: Record<PolicyDisposition, 'accent' | 'info' | 'success'> = {
  auto_queue: 'accent', notify_only: 'info', notify_and_cache: 'success',
}
