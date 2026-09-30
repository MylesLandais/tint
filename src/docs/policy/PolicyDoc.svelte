<script lang="ts">
  import { onMount } from 'svelte'
  import { Button, InteractiveGraphView, PolicyDryRun, PolicyEditor, PolicyTable,
    type PolicyRule } from '../../svelte'
  import { dispatchPolicyCommand, getDemoFeedStore, subscribeDemoFeedStore, upsertPolicyRule } from '../feed/demoStore'
  import { workflowForName } from './workflowFixtures'
  import DocPage from '../svelte/DocPage.svelte'
  import type { ApiRow } from '../svelte/types'

  const initialSnapshot = getDemoFeedStore()
  let snapshot = $state(initialSnapshot)
  let selectedId = $state<string | null>(initialSnapshot.policy.rules[0]?.id ?? null)
  let draft = $state<PolicyRule | null>(null)
  let sources = $derived(snapshot.feed.sources.map((source) => ({ id: source.id, label: source.handle })))
  let sourceLabels = $derived(Object.fromEntries(snapshot.feed.sources.map((source) => [source.id, source.handle])))
  let selectedRule = $derived(draft?.id === selectedId ? draft : snapshot.policy.rules.find((rule) => rule.id === selectedId) ?? snapshot.policy.rules[0] ?? null)
  let source = $derived(snapshot.feed.sources.find((item) => item.id === selectedRule?.sourceId))
  let workflow = $derived(workflowForName(source?.workflowName ?? 'youtube-poll'))

  onMount(() => subscribeDemoFeedStore(() => snapshot = getDemoFeedStore()))

  function select(ruleId: string) { selectedId = ruleId; draft = null }
  function toggle(ruleId: string, enabled: boolean) {
    dispatchPolicyCommand({ type: 'policy.toggle', ruleId, enabled })
    selectedId = ruleId
    draft = null
  }
  function save() { if (draft) { upsertPolicyRule(draft); draft = null } }

  const api: ApiRow[] = [
    { prop: 'PolicyTable rules / selectedId / onSelect', type: 'PolicyRule[] / string | null / callback', description: 'Host-owned policy rows and controlled selection.' },
    { prop: 'PolicyTable onToggle / sourceLabels / density', type: 'callback / Record / TableDensity', description: 'Enabled intent, source names, and table density.' },
    { prop: 'PolicyEditor rule / onChange / sources', type: 'PolicyRule / callback / options[]', description: 'Controlled builder or Lua source editing.' },
    { prop: 'PolicyDryRun rule / entries', type: 'PolicyRule / FeedEntry[]', description: 'Fixture-only evaluation; Lua is never executed in the browser.' },
    { prop: 'applyPolicyCommand', type: 'pure TypeScript reducer', description: 'Applies host-approved policy commands and advances the revision.' },
  ]
  const usage = `import { PolicyTable, PolicyEditor, PolicyDryRun, applyPolicyCommand } from '@nebula/tint/policy'

let policy = $state(initialPolicy)
let selectedId = $state<string | null>(policy.rules[0]?.id ?? null)
<PolicyTable rules={policy.rules} {selectedId} onSelect={(id) => selectedId = id}
  onToggle={(id, enabled) => policy = applyPolicyCommand(policy, { type: 'policy.toggle', ruleId: id, enabled })} />
<PolicyEditor rule={selectedRule} {sources} onChange={(rule) => draft = rule} />
<PolicyDryRun rule={selectedRule} entries={feed.entries} />`
</script>

<DocPage title="Policy" description="Rule table, builder and Lua editor, fixture dry-run, and a read-only workflow graph. The docs demo store owns all changes; Lua is highlighted as text and runs only in a host service." importPath="@nebula/tint/policy" {usage} {api} accessibility="The table supports row selection, sorting, and labeled enabled toggles. Builder controls use native labels and visible focus. The dry-run result has text badges and a live status region; workflow nodes remain named and inspectable without color alone.">
  <div class="policy-demo">
    <PolicyTable rules={snapshot.policy.rules} selectedId={selectedRule?.id ?? null} {sourceLabels} onSelect={select} onToggle={toggle} />
    {#if selectedRule}
      <PolicyEditor rule={selectedRule} {sources} onChange={(rule) => draft = rule} />
      <div class="save"><Button size="sm" variant="primary" disabled={!draft} onclick={save}>Save rule</Button></div>
      <PolicyDryRun rule={selectedRule} entries={snapshot.feed.entries} />
      <section><h3>Workflow · {source?.workflowName ?? 'youtube-poll'}</h3><p>Read-only workflow composition. Disposition conditions live on graph edges.</p><div class="workflow"><InteractiveGraphView document={workflow} readonly showInspector={false} showFullscreenControl={false} /></div></section>
    {/if}
  </div>
</DocPage>

<style>
  .policy-demo { display: grid; gap: 1.25rem; }
  .save { display: flex; justify-content: flex-end; }
  h3 { margin: 0 0 .5rem; color: var(--tint-ink); font-size: .9rem; }
  p { margin: 0 0 .75rem; color: var(--tint-muted); font-size: .78rem; }
  .workflow { height: 22rem; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); }
</style>
