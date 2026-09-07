/**
 * Host-owned policy document — builder clauses or a Lua source string.
 *
 * Tint edits and dry-runs the builder for real. Lua mode is edited + highlighted
 * here; execution stays in Kino. Mocked dry-run returns fixture-scripted results.
 */

import type { FeedEntry, PolicyDisposition, RevisionToken } from '../feed/contracts'
import { nextFeedRevision } from '../feed/contracts'

export type { PolicyDisposition }

export type PolicyId = string

export type MatchField = 'title' | 'excerpt' | 'tags' | 'url' | 'contentKind'

export type MatchOperator = 'contains' | 'equals' | 'starts_with' | 'includes_tag'

export type MatchClause = {
  id: string
  field: MatchField
  operator: MatchOperator
  value: string
}

export type MatchCriteria =
  | { mode: 'builder'; clauses: readonly MatchClause[] }
  | { mode: 'lua'; source: string }

export type WorkflowEdge = 'feed_write' | 'notify' | 'intent_create'

export type PolicyRule = {
  id: string
  sourceId: string
  name: string
  enabled: boolean
  criteria: MatchCriteria
  disposition: PolicyDisposition
  workflowEdge: WorkflowEdge
  matchCount: number
  lastMatchAt?: string
}

export type PolicyDocument = {
  schemaVersion: string
  id: PolicyId
  revision: RevisionToken
  rules: readonly PolicyRule[]
  metadata: Record<string, unknown>
}

export type PolicyCommand =
  | { type: 'policy.create'; rule: PolicyRule }
  | { type: 'policy.update'; ruleId: string; patch: Partial<Omit<PolicyRule, 'id'>> }
  | { type: 'policy.toggle'; ruleId: string; enabled: boolean }
  | { type: 'policy.delete'; ruleId: string }

/**
 * Apply a policy command. Same ownership rule as graph `applyCommand`: the
 * editor reports, the host stores. Returns the same reference when nothing changed.
 */
export function applyPolicyCommand(
  document: PolicyDocument,
  command: PolicyCommand,
): PolicyDocument {
  switch (command.type) {
    case 'policy.create': {
      if (document.rules.some((rule) => rule.id === command.rule.id)) return document
      return commit(document, { rules: [...document.rules, command.rule] })
    }
    case 'policy.update': {
      let changed = false
      const rules = document.rules.map((rule) => {
        if (rule.id !== command.ruleId) return rule
        changed = true
        return { ...rule, ...command.patch, id: rule.id }
      })
      return changed ? commit(document, { rules }) : document
    }
    case 'policy.toggle': {
      let changed = false
      const rules = document.rules.map((rule) => {
        if (rule.id !== command.ruleId || rule.enabled === command.enabled) return rule
        changed = true
        return { ...rule, enabled: command.enabled }
      })
      return changed ? commit(document, { rules }) : document
    }
    case 'policy.delete': {
      const rules = document.rules.filter((rule) => rule.id !== command.ruleId)
      return rules.length === document.rules.length ? document : commit(document, { rules })
    }
  }
}

function commit(
  document: PolicyDocument,
  patch: Partial<Pick<PolicyDocument, 'rules' | 'metadata'>>,
): PolicyDocument {
  return {
    ...document,
    ...patch,
    revision: nextFeedRevision(document.revision),
  }
}

function fieldValue(entry: FeedEntry, field: MatchField): string | readonly string[] {
  switch (field) {
    case 'title':
      return entry.title
    case 'excerpt':
      return entry.excerpt
    case 'tags':
      return entry.tags
    case 'url':
      return entry.url
    case 'contentKind':
      return entry.contentKind
  }
}

/** Evaluate one builder clause against an entry. */
export function matchClause(entry: FeedEntry, clause: MatchClause): boolean {
  const raw = fieldValue(entry, clause.field)
  const needle = clause.value.toLowerCase()

  if (clause.operator === 'includes_tag') {
    const tags = Array.isArray(raw) ? raw : [String(raw)]
    return tags.some((tag) => tag.toLowerCase() === needle)
  }

  const haystack = (Array.isArray(raw) ? raw.join(' ') : String(raw)).toLowerCase()
  switch (clause.operator) {
    case 'contains':
      return haystack.includes(needle)
    case 'equals':
      return haystack === needle
    case 'starts_with':
      return haystack.startsWith(needle)
  }
}

/**
 * Builder mode: every clause must match (AND). Lua mode is not executed here —
 * callers should use `mockMatchLua` for dry-run fixtures.
 */
export function matchEntry(entry: FeedEntry, criteria: MatchCriteria): boolean {
  if (criteria.mode === 'lua') return false
  if (criteria.clauses.length === 0) return false
  return criteria.clauses.every((clause) => matchClause(entry, clause))
}

export type DryRunResult = {
  matched: boolean
  disposition?: PolicyDisposition
  /** Human-readable note (Lua sandbox errors, empty builder, …). */
  note?: string
}

/**
 * Mocked dry-run. Builder clauses run for real. Lua returns fixture-scripted
 * results plus a sample sandbox-error string when the source contains `error`.
 */
export function mockDryRun(
  entry: FeedEntry,
  rule: Pick<PolicyRule, 'criteria' | 'disposition' | 'enabled'>,
): DryRunResult {
  if (!rule.enabled) {
    return { matched: false, note: 'Rule is disabled.' }
  }

  if (rule.criteria.mode === 'builder') {
    if (rule.criteria.clauses.length === 0) {
      return { matched: false, note: 'Add at least one clause.' }
    }
    const matched = matchEntry(entry, rule.criteria)
    return matched
      ? { matched: true, disposition: rule.disposition }
      : { matched: false, note: 'No clause set matched this entry.' }
  }

  const source = rule.criteria.source
  if (/\berror\b/i.test(source)) {
    return {
      matched: false,
      note: 'Sandbox error (fixture): instruction limit exceeded after 10_000 steps. Memory peak 4.2 MiB.',
    }
  }
  // Demo heuristic: Lua scripts that mention the entry title (case-insensitive) "match".
  const matched = source.toLowerCase().includes(entry.title.toLowerCase().slice(0, 12))
  return matched
    ? {
        matched: true,
        disposition: rule.disposition,
        note: 'Lua not executed in the browser — this is a fixture-scripted result.',
      }
    : {
        matched: false,
        note: 'Lua not executed in the browser — fixture reported no match.',
      }
}

/** Count how many of `entries` the builder (or mocked Lua) would match. */
export function countMatches(
  entries: readonly FeedEntry[],
  rule: Pick<PolicyRule, 'criteria' | 'disposition' | 'enabled'>,
): number {
  return entries.filter((entry) => mockDryRun(entry, rule).matched).length
}
