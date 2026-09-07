import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  applyPolicyCommand,
  PolicyDryRun,
  PolicyEditor,
  PolicyTable,
  type PolicyRule,
} from '../../components/policy'
import { InteractiveGraphView } from '../../components/graph'
import '../../components/graph/graph.css'
import { CodeBlock } from '../components/CodeBlock'
import { DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'
import {
  dispatchPolicyCommand,
  getDemoFeedStore,
  subscribeDemoFeedStore,
  upsertPolicyRule,
} from '../feed/demoStore'
import { Button } from '../../components/button'
import { createWorkflowNodeRegistry } from './workflowDefinitions'
import { workflowForName } from './workflowFixtures'

const usage = `import { PolicyTable, PolicyEditor, PolicyDryRun, applyPolicyCommand } from 'tint/policy'`

function PolicyWorkbench() {
  const { feed, policy } = useSyncExternalStore(
    subscribeDemoFeedStore,
    getDemoFeedStore,
    getDemoFeedStore,
  )
  const [selectedId, setSelectedId] = useState(policy.rules[0]?.id ?? null)
  const [draft, setDraft] = useState<PolicyRule | null>(policy.rules[0] ?? null)

  const sourceLabels = useMemo(
    () => Object.fromEntries(feed.sources.map((source) => [source.id, source.handle])),
    [feed.sources],
  )
  const sources = useMemo(
    () => feed.sources.map((source) => ({ id: source.id, label: source.handle })),
    [feed.sources],
  )

  const selectedRule =
    draft && draft.id === selectedId
      ? draft
      : (policy.rules.find((rule) => rule.id === selectedId) ?? policy.rules[0])

  const source = feed.sources.find((item) => item.id === selectedRule?.sourceId)
  const workflow = workflowForName(source?.workflowName ?? 'youtube-poll')
  const registry = useMemo(() => createWorkflowNodeRegistry(), [])

  return (
    <div className="flex flex-col gap-6">
      <PolicyTable
        rules={policy.rules}
        selectedId={selectedRule?.id ?? null}
        sourceLabels={sourceLabels}
        onSelect={(ruleId) => {
          setSelectedId(ruleId)
          setDraft(policy.rules.find((rule) => rule.id === ruleId) ?? null)
        }}
        onToggle={(ruleId, enabled) => {
          dispatchPolicyCommand({ type: 'policy.toggle', ruleId, enabled })
          setSelectedId(ruleId)
          const next = applyPolicyCommand(policy, {
            type: 'policy.toggle',
            ruleId,
            enabled,
          })
          setDraft(next.rules.find((item) => item.id === ruleId) ?? null)
        }}
      />

      {selectedRule ? (
        <>
          <PolicyEditor
            rule={selectedRule}
            sources={sources}
            onChange={(rule) => setDraft(rule)}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (draft) upsertPolicyRule(draft)
              }}
            >
              Save rule
            </Button>
          </div>
          <PolicyDryRun rule={selectedRule} entries={feed.entries} />
          <div>
            <h3 className="mt-0 mb-2 text-sm font-semibold text-tint-ink">
              Workflow · {source?.workflowName ?? 'youtube-poll'}
            </h3>
            <p className="mt-0 mb-3 text-xs text-tint-muted">
              Read-only docs composition. Disposition conditions live on edge metadata, not in React
              branches.
            </p>
            <div className="h-[22rem] overflow-hidden rounded-xl border border-tint-border">
              <InteractiveGraphView
                document={workflow}
                registry={registry}
                readonly
                showInspector={false}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

export function PolicyDoc() {
  return (
    <DocsPage
      route="components/policy"
      title="Policy"
      intro="Rule table, builder/Lua editor, mocked dry-run, and a read-only workflow graph for the selected source. Lua is highlighted here; execution stays on the host."
      note="Maya’s Subscriptions chat scenario writes into the docs demo store — new sources and rules appear here after confirmation."
    >
      <DocsSection id="preview" title="Workbench">
        <DocsPreview>
          <PolicyWorkbench />
        </DocsPreview>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />
      </DocsSection>

      <DocsSection id="api" title="API">
        <PropsTable
          rows={[
            {
              name: 'rules',
              type: 'readonly PolicyRule[]',
              required: true,
              description: 'PolicyTable rows.',
            },
            {
              name: 'selectedId',
              type: 'string | null',
              description: 'Highlighted rule id.',
            },
            {
              name: 'onSelect',
              type: '(ruleId: string) => void',
              description: 'Row selection intent.',
            },
            {
              name: 'onToggle',
              type: '(ruleId: string, enabled: boolean) => void',
              description: 'Enabled checkbox intent; host runs applyPolicyCommand.',
            },
            {
              name: 'sourceLabels',
              type: 'Record<string, string>',
              description: 'sourceId → handle for the Source column.',
            },
            {
              name: 'density',
              type: 'TableDensity',
              description: 'DataTable density passthrough.',
            },
            {
              name: 'rule',
              type: 'PolicyRule',
              required: true,
              description: 'PolicyEditor / dry-run rule document.',
            },
            {
              name: 'onChange',
              type: '(rule: PolicyRule) => void',
              required: true,
              description: 'Editor reports the next rule; host stores it.',
            },
            {
              name: 'sources',
              type: '{ id: string; label: string }[]',
              required: true,
              description: 'Source picker options.',
            },
            {
              name: 'disabled',
              type: 'boolean',
              description: 'Locks PolicyEditor controls.',
            },
            {
              name: 'entries',
              type: 'readonly FeedEntry[]',
              required: true,
              description: 'PolicyDryRun fixture entries.',
            },
            { name: 'className', type: 'string', description: 'Appended to the root element.' },
          ]}
        />
      </DocsSection>
    </DocsPage>
  )
}
