import { useId } from 'react'
import { Button } from '../button'
import { HighlightedCode } from '../code'
import { cn } from '../../lib/utils'
import type {
  MatchClause,
  MatchCriteria,
  MatchField,
  MatchOperator,
  PolicyDisposition,
  PolicyRule,
  WorkflowEdge,
} from './contracts'

export type PolicyEditorProps = {
  rule: PolicyRule
  onChange: (rule: PolicyRule) => void
  /** Available sources for the source picker. */
  sources: readonly { id: string; label: string }[]
  className?: string
  disabled?: boolean
}

const FIELDS: readonly MatchField[] = ['title', 'excerpt', 'tags', 'url', 'contentKind']
const OPERATORS: readonly MatchOperator[] = [
  'contains',
  'equals',
  'starts_with',
  'includes_tag',
]
const DISPOSITIONS: readonly PolicyDisposition[] = [
  'notify_only',
  'notify_and_cache',
  'auto_queue',
]
const EDGES: readonly WorkflowEdge[] = ['feed_write', 'notify', 'intent_create']

function newClause(): MatchClause {
  return {
    id: `c-${crypto.randomUUID().slice(0, 8)}`,
    field: 'title',
    operator: 'contains',
    value: '',
  }
}

/**
 * Form-ish editor for a PolicyRule: name / disposition / source, then either a
 * repeatable builder or a Lua CodeField (textarea + HighlightedCode preview).
 *
 * Lua is edited and highlighted here; it is never executed in the browser.
 */
export function PolicyEditor({
  rule,
  onChange,
  sources,
  className,
  disabled = false,
}: PolicyEditorProps) {
  const nameId = useId()
  const luaId = useId()
  const criteria = rule.criteria
  const mode = criteria.mode

  const setCriteria = (next: MatchCriteria) => onChange({ ...rule, criteria: next })

  return (
    <div
      data-tint-policy-editor=""
      className={cn('flex flex-col gap-4 rounded-xl border border-tint-border bg-tint-panel p-4', className)}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-tint-muted" id={nameId}>
            Name
          </span>
          <input
            aria-labelledby={nameId}
            className="rounded-md border border-tint-border bg-tint-surface px-2 py-1.5 text-sm"
            value={rule.name}
            disabled={disabled}
            onChange={(event) => onChange({ ...rule, name: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-tint-muted">Source</span>
          <select
            className="rounded-md border border-tint-border bg-tint-surface px-2 py-1.5 text-sm"
            value={rule.sourceId}
            disabled={disabled}
            onChange={(event) => onChange({ ...rule, sourceId: event.target.value })}
          >
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-tint-muted">Disposition</span>
          <select
            className="rounded-md border border-tint-border bg-tint-surface px-2 py-1.5 text-sm"
            value={rule.disposition}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...rule, disposition: event.target.value as PolicyDisposition })
            }
          >
            {DISPOSITIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs font-medium text-tint-muted">Workflow edge</span>
          <select
            className="rounded-md border border-tint-border bg-tint-surface px-2 py-1.5 text-sm"
            value={rule.workflowEdge}
            disabled={disabled}
            onChange={(event) =>
              onChange({ ...rule, workflowEdge: event.target.value as WorkflowEdge })
            }
          >
            {EDGES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Criteria mode">
        <Button
          size="sm"
          variant={mode === 'builder' ? 'primary' : 'ghost'}
          disabled={disabled}
          onClick={() =>
            setCriteria({
              mode: 'builder',
              clauses:
                criteria.mode === 'builder' && criteria.clauses.length > 0
                  ? criteria.clauses
                  : [newClause()],
            })
          }
        >
          Builder
        </Button>
        <Button
          size="sm"
          variant={mode === 'lua' ? 'primary' : 'ghost'}
          disabled={disabled}
          onClick={() =>
            setCriteria({
              mode: 'lua',
              source:
                criteria.mode === 'lua'
                  ? criteria.source
                  : '-- Demo only: not executed in the browser\nreturn true',
            })
          }
        >
          Lua
        </Button>
      </div>

      {mode === 'builder' && criteria.mode === 'builder' ? (
        <div className="flex flex-col gap-2">
          {criteria.clauses.map((clause, index) => (
            <div
              key={clause.id}
              className="grid gap-2 rounded-lg border border-tint-border bg-tint-surface p-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
            >
              <select
                className="rounded-md border border-tint-border bg-tint-panel px-2 py-1 text-xs"
                value={clause.field}
                disabled={disabled}
                aria-label={`Clause ${index + 1} field`}
                onChange={(event) => {
                  const clauses = criteria.clauses.map((item) =>
                    item.id === clause.id
                      ? { ...item, field: event.target.value as MatchField }
                      : item,
                  )
                  setCriteria({ mode: 'builder', clauses })
                }}
              >
                {FIELDS.map((field) => (
                  <option key={field} value={field}>
                    {field}
                  </option>
                ))}
              </select>
              <select
                className="rounded-md border border-tint-border bg-tint-panel px-2 py-1 text-xs"
                value={clause.operator}
                disabled={disabled}
                aria-label={`Clause ${index + 1} operator`}
                onChange={(event) => {
                  const clauses = criteria.clauses.map((item) =>
                    item.id === clause.id
                      ? { ...item, operator: event.target.value as MatchOperator }
                      : item,
                  )
                  setCriteria({ mode: 'builder', clauses })
                }}
              >
                {OPERATORS.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator}
                  </option>
                ))}
              </select>
              <input
                className="rounded-md border border-tint-border bg-tint-panel px-2 py-1 text-xs"
                value={clause.value}
                disabled={disabled}
                aria-label={`Clause ${index + 1} value`}
                onChange={(event) => {
                  const clauses = criteria.clauses.map((item) =>
                    item.id === clause.id ? { ...item, value: event.target.value } : item,
                  )
                  setCriteria({ mode: 'builder', clauses })
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={disabled || criteria.clauses.length <= 1}
                onClick={() =>
                  setCriteria({
                    mode: 'builder',
                    clauses: criteria.clauses.filter((item) => item.id !== clause.id),
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() =>
              setCriteria({ mode: 'builder', clauses: [...criteria.clauses, newClause()] })
            }
          >
            Add clause
          </Button>
        </div>
      ) : null}

      {mode === 'lua' && criteria.mode === 'lua' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-tint-muted" id={luaId}>
              Lua source
            </span>
            <textarea
              aria-labelledby={luaId}
              className="min-h-40 rounded-md border border-tint-border bg-tint-surface p-2 font-mono text-xs"
              value={criteria.source}
              disabled={disabled}
              spellCheck={false}
              onChange={(event) => setCriteria({ mode: 'lua', source: event.target.value })}
            />
          </label>
          <div className="overflow-auto rounded-md border border-tint-border bg-tint-surface p-2">
            <HighlightedCode code={criteria.source} language="lua" lineNumbers />
          </div>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={rule.enabled}
          disabled={disabled}
          onChange={(event) => onChange({ ...rule, enabled: event.target.checked })}
        />
        Enabled
      </label>
    </div>
  )
}
