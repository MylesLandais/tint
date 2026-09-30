<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements'
  import { nextWorkspaceTabId } from '../../../core/shell/navigation'
  import type { WorkspaceTab } from './types'

  type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
    tabs: readonly WorkspaceTab[]
    value: string
    onChange: (id: string) => void
    label: string
  }
  let { tabs, value, onChange, label, class: className, ...rest }: Props = $props()
  const id = $props.id()
  const refs = new Map<string, HTMLButtonElement>()
  function keydown(event: KeyboardEvent, tab: WorkspaceTab) {
    const next = nextWorkspaceTabId(tabs, tab.id, event.key)
    if (!next) return
    event.preventDefault()
    onChange(next)
    refs.get(next)?.focus()
  }
</script>

<div {...rest} data-tint-tabs class={className}>
  <div role="tablist" aria-label={label} class="flex gap-6 border-b border-tint-border">
    {#each tabs as tab (tab.id)}
      <button type="button" role="tab" id={`${id}-${tab.id}`} aria-controls={`${id}-${tab.id}-panel`}
        aria-selected={tab.id === value} tabindex={tab.id === value ? 0 : -1} disabled={tab.disabled}
        bind:this={() => refs.get(tab.id), (node) => { if (node) refs.set(tab.id, node); else refs.delete(tab.id) }}
        onclick={() => onChange(tab.id)} onkeydown={(event) => keydown(event, tab)}
        class={['border-b-2 border-transparent px-1 py-3 text-sm text-tint-muted', tab.id === value && 'border-tint-accent text-tint-accent']}>
        {tab.label}
      </button>
    {/each}
  </div>
  {#each tabs as tab (tab.id)}
    <div role="tabpanel" id={`${id}-${tab.id}-panel`} aria-labelledby={`${id}-${tab.id}`}
      hidden={value !== tab.id} tabindex="0" class="pt-4">{@render tab.content?.()}</div>
  {/each}
</div>
