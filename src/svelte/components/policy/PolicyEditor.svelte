<script lang="ts">
  import {
    addPolicyClause, criteriaForMode, POLICY_DISPOSITIONS, POLICY_EDGES, POLICY_FIELDS,
    POLICY_OPERATORS, removePolicyClause, updatePolicyClause, withPolicyCriteria, withPolicyRule,
    type MatchClause, type MatchCriteria, type PolicyDisposition, type WorkflowEdge,
  } from '../../../core/policy'
  import HighlightedCode from '../code/HighlightedCode.svelte'
  import type { PolicyEditorProps } from './types'

  let { rule, onChange, sources, class: className, disabled = false }: PolicyEditorProps = $props()
  let criteria = $derived(rule.criteria)

  function clauseId() { return `c-${crypto.randomUUID().slice(0, 8)}` }
  function setCriteria(next: MatchCriteria) { onChange(withPolicyCriteria(rule, next)) }
  function switchMode(mode: MatchCriteria['mode']) { setCriteria(criteriaForMode(criteria, mode, clauseId())) }
  function addClause() { if (criteria.mode === 'builder') setCriteria(addPolicyClause(criteria, clauseId())) }
  function removeClause(id: string) { if (criteria.mode === 'builder') setCriteria(removePolicyClause(criteria, id)) }
  function changeClause(id: string, patch: Partial<Omit<MatchClause, 'id'>>) {
    if (criteria.mode === 'builder') setCriteria(updatePolicyClause(criteria, id, patch))
  }

  function changeName(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    onChange(withPolicyRule(rule, { name: input.value }))
    input.value = rule.name
  }
  function changeSource(event: Event) {
    const select = event.currentTarget as HTMLSelectElement
    onChange(withPolicyRule(rule, { sourceId: select.value }))
    select.value = rule.sourceId
  }
  function changeDisposition(event: Event) {
    const select = event.currentTarget as HTMLSelectElement
    onChange(withPolicyRule(rule, { disposition: select.value as PolicyDisposition }))
    select.value = rule.disposition
  }
  function changeEdge(event: Event) {
    const select = event.currentTarget as HTMLSelectElement
    onChange(withPolicyRule(rule, { workflowEdge: select.value as WorkflowEdge }))
    select.value = rule.workflowEdge
  }
  function changeLua(event: Event) {
    const textarea = event.currentTarget as HTMLTextAreaElement
    const source = textarea.value
    setCriteria({ mode: 'lua', source })
    textarea.value = criteria.mode === 'lua' ? criteria.source : ''
  }
  function changeEnabled(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    onChange(withPolicyRule(rule, { enabled: input.checked }))
    input.checked = rule.enabled
  }
  function changeClauseField(event: Event, id: string) {
    const select = event.currentTarget as HTMLSelectElement
    changeClause(id, { field: select.value as MatchClause['field'] })
    if (criteria.mode === 'builder') select.value = criteria.clauses.find((clause) => clause.id === id)?.field ?? 'title'
  }
  function changeClauseOperator(event: Event, id: string) {
    const select = event.currentTarget as HTMLSelectElement
    changeClause(id, { operator: select.value as MatchClause['operator'] })
    if (criteria.mode === 'builder') select.value = criteria.clauses.find((clause) => clause.id === id)?.operator ?? 'contains'
  }
  function changeClauseValue(event: Event, id: string) {
    const input = event.currentTarget as HTMLInputElement
    changeClause(id, { value: input.value })
    if (criteria.mode === 'builder') input.value = criteria.clauses.find((clause) => clause.id === id)?.value ?? ''
  }
</script>

<div data-tint-policy-editor="" class={['policy-editor', className].filter(Boolean).join(' ')}>
  <div class="basics">
    <label><span>Name</span><input aria-label="Name" value={rule.name} {disabled} oninput={changeName} /></label>
    <label><span>Source</span><select class="tint-select" value={rule.sourceId} {disabled} onchange={changeSource}>{#each sources as source (source.id)}<option value={source.id}>{source.label}</option>{/each}</select></label>
    <label><span>Disposition</span><select class="tint-select" value={rule.disposition} {disabled} onchange={changeDisposition}>{#each POLICY_DISPOSITIONS as value (value)}<option value={value}>{value}</option>{/each}</select></label>
    <label><span>Workflow edge</span><select class="tint-select" value={rule.workflowEdge} {disabled} onchange={changeEdge}>{#each POLICY_EDGES as value (value)}<option value={value}>{value}</option>{/each}</select></label>
  </div>

  <div class="mode" role="group" aria-label="Criteria mode">
    <button type="button" aria-pressed={criteria.mode === 'builder'} {disabled} onclick={() => switchMode('builder')}>Builder</button>
    <button type="button" aria-pressed={criteria.mode === 'lua'} {disabled} onclick={() => switchMode('lua')}>Lua</button>
  </div>

  {#if criteria.mode === 'builder'}
    <div class="clauses">
      {#each criteria.clauses as clause, index (clause.id)}
        <div class="clause">
          <select class="tint-select" aria-label={`Clause ${index + 1} field`} value={clause.field} {disabled} onchange={(event) => changeClauseField(event, clause.id)}>{#each POLICY_FIELDS as field (field)}<option value={field}>{field}</option>{/each}</select>
          <select class="tint-select" aria-label={`Clause ${index + 1} operator`} value={clause.operator} {disabled} onchange={(event) => changeClauseOperator(event, clause.id)}>{#each POLICY_OPERATORS as operator (operator)}<option value={operator}>{operator}</option>{/each}</select>
          <input aria-label={`Clause ${index + 1} value`} value={clause.value} {disabled} oninput={(event) => changeClauseValue(event, clause.id)} />
          <button type="button" class="remove" disabled={disabled || criteria.clauses.length <= 1} onclick={() => removeClause(clause.id)}>Remove</button>
        </div>
      {/each}
      <button type="button" class="add" {disabled} onclick={addClause}>Add clause</button>
    </div>
  {:else}
    <div class="lua">
      <label><span>Lua source</span><textarea aria-label="Lua source" value={criteria.source} {disabled} spellcheck="false" oninput={changeLua}></textarea></label>
      <pre aria-label="Lua preview"><HighlightedCode code={criteria.source} language="lua" lineNumbers /></pre>
    </div>
  {/if}

  <label class="enabled"><input type="checkbox" checked={rule.enabled} {disabled} onchange={changeEnabled} />Enabled</label>
</div>

<style>
  .policy-editor { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-4); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); padding: var(--tint-space-4); container-type: inline-size; }
  .basics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tint-space-3); }
  label { display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-1); color: var(--tint-ink); font-size: var(--tint-font-size-sm); }
  label span { color: var(--tint-muted); font-size: var(--tint-font-size-xs); font-weight: 500; }
  :is(input:not([type='checkbox']), select, textarea) { min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: var(--tint-space-1) var(--tint-space-2); color: var(--tint-ink); font: inherit; font-size: var(--tint-font-size-sm); }
  .mode { display: flex; flex-wrap: wrap; gap: var(--tint-space-2); }
  button { min-height: 2rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: 0 var(--tint-space-3); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  button:hover { background: var(--tint-accent-soft); }
  .mode button[aria-pressed='true'] { border-color: var(--tint-accent); background: var(--tint-accent); color: var(--tint-on-accent); }
  .clauses { display: flex; flex-direction: column; gap: var(--tint-space-2); }
  .clause { display: grid; min-width: 0; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; gap: var(--tint-space-2); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-surface); padding: var(--tint-space-2); }
  .clause :is(input, select) { background: var(--tint-panel); font-size: var(--tint-font-size-xs); }
  .add { align-self: flex-start; }
  .lua { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tint-space-3); }
  textarea { min-height: 10rem; resize: vertical; font-family: var(--tint-font-mono, monospace); font-size: var(--tint-font-size-xs); }
  pre { min-width: 0; max-height: 18rem; margin: 0; overflow: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: var(--tint-space-2); font-size: var(--tint-font-size-xs); }
  .enabled { flex-direction: row; align-items: center; gap: var(--tint-space-2); }
  :is(input, select, textarea, button):focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  :is(input, select, textarea, button):disabled { opacity: 0.6; cursor: not-allowed; }
  @container (max-width: 560px) { .lua { grid-template-columns: 1fr; } .clause { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @container (max-width: 420px) { .basics { grid-template-columns: 1fr; } .clause { grid-template-columns: 1fr; } }
</style>
