import type { FeedEntry } from '../../../core/feed'
import type { PolicyRule } from '../../../core/policy'

export type PolicyEditorProps = {
  rule: PolicyRule
  onChange: (rule: PolicyRule) => void
  sources: readonly { id: string; label: string }[]
  class?: string
  disabled?: boolean
}

export type PolicyDryRunProps = {
  rule: Pick<PolicyRule, 'criteria' | 'disposition' | 'enabled' | 'name'>
  entries: readonly FeedEntry[]
  class?: string
}

export type PolicyTableProps = {
  rules: readonly PolicyRule[]
  selectedId?: string | null
  onSelect?: (ruleId: string) => void
  onToggle?: (ruleId: string, enabled: boolean) => void
  sourceLabels?: Readonly<Record<string, string>>
  class?: string
  density?: 'compact' | 'comfortable' | 'spacious'
}
