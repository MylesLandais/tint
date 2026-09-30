<script lang="ts">
  import { POLICY_DISPOSITION_TONES, type PolicyRule } from '../../../core/policy'
  import type { TableSelectionChange } from '../../../core/table/types'
  import Badge from '../badge/Badge.svelte'
  import DataTable from '../table/DataTable.svelte'
  import type { TableColumn } from '../table/types'
  import type { PolicyTableProps } from './types'

  let {
    rules, selectedId = null, onSelect, onToggle, sourceLabels,
    class: className, density = 'comfortable',
  }: PolicyTableProps = $props()

  function selectionChanged(change: TableSelectionChange) {
    const next = change.selection[0]
    if (next) onSelect?.(next)
  }
</script>

{#snippet ruleCell(row: PolicyRule)}<button type="button" class="rule-name" disabled={!onSelect} onclick={() => onSelect?.(row.id)}>{row.name}</button>{/snippet}
{#snippet dispositionCell(row: PolicyRule)}<Badge tone={POLICY_DISPOSITION_TONES[row.disposition]}>{row.disposition}</Badge>{/snippet}
{#snippet enabledCell(row: PolicyRule)}<input type="checkbox" aria-label={`Enable ${row.name}`} checked={row.enabled} disabled={!onToggle} onchange={(event) => { onToggle?.(row.id, event.currentTarget.checked); event.currentTarget.checked = row.enabled }} />{/snippet}

<div data-tint-policy-table="" data-selected={selectedId ?? undefined} class={['policy-table', className].filter(Boolean).join(' ')}>
  <DataTable
    rows={rules}
    columns={[
      { id: 'name', header: 'Rule', sortable: true, renderCell: ruleCell },
      { id: 'sourceId', header: 'Source', accessor: (row: PolicyRule) => sourceLabels?.[row.sourceId] ?? row.sourceId, sortable: true },
      { id: 'disposition', header: 'Disposition', renderCell: dispositionCell },
      { id: 'matchCount', header: 'Matches', type: 'number', sortable: true, align: 'end' },
      { id: 'enabled', header: 'On', hideable: false, renderCell: enabledCell },
    ] satisfies TableColumn<PolicyRule>[]}
    rowId="id" {density} label="Policy rules"
    selection={selectedId ? [selectedId] : []}
    onSelectionChange={onSelect ? selectionChanged : undefined}
  />
</div>

<style>
  .policy-table { min-width: 0; max-width: 100%; container-type: inline-size; }
  .rule-name { border: 0; background: transparent; padding: 0; color: var(--tint-ink); cursor: pointer; font: inherit; font-weight: 500; text-align: left; }
  .rule-name:hover { text-decoration: underline; }
  .rule-name:disabled { cursor: default; text-decoration: none; }
  .rule-name:focus-visible, input:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  input[type='checkbox'] { accent-color: var(--tint-accent); }
</style>
